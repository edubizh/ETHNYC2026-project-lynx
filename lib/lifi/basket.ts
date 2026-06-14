import { encodeFunctionData, type Address, type Hex } from "viem";
import { ADDR } from "@/lib/addresses";
import { getTheme } from "@/lib/baskets/registry";
import type { AssetLeg } from "@/lib/baskets/types";
import { buildExactInputSingleData } from "@/lib/uniswap/router";

export const ENTER_PREDICTION_LEG_ABI = [
  {
    type: "function",
    name: "enterPredictionLeg",
    stateMutability: "nonpayable",
    inputs: [
      { name: "conditionId", type: "bytes32" },
      { name: "questionId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [],
  },
] as const;

export const ENTER_ASSET_LEG_ABI = [
  {
    type: "function",
    name: "enterAssetLeg",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "router", type: "address" },
      { name: "spender", type: "address" },
      { name: "assetOut", type: "address" },
      { name: "minAmountOut", type: "uint256" },
      { name: "swapData", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export type ContractCall = {
  fromAmount: string;
  fromTokenAddress: Address;
  toContractAddress: Address;
  toContractCallData: Hex;
  toContractGasLimit: string;
  toApprovalAddress: Address;
};

/**
 * Split a single USDC.e deposit across the bucket's FULL strategy — prediction markets (neutral YES+NO
 * sets) AND the on-chain asset sleeve (Uniswap swaps) — one weighted LI.FI contractCall each. Weights
 * sum to 1 across all legs; the LAST leg absorbs the rounding remainder so the deposit is fully allocated.
 * Asset legs route through EnterBasket.enterAssetLeg (Uniswap SwapRouter02), revert-safe.
 *
 * @param opts.minOut  per-asset-leg minimum output (token base units). Pure/injected so this stays
 *                     synchronous + testable; the async Uniswap /quote layer supplies real slippage floors
 *                     in production. Defaults to 0n (NO protection — tests/dev only).
 */
export function buildBasketContractCalls(
  slug: string,
  totalUsdce: bigint,
  recipient: Address,
  enterBasket: Address,
  opts?: { minOut?: (leg: AssetLeg, amount: bigint) => bigint },
): ContractCall[] {
  const legs = getTheme(slug).legs;
  if (!legs.some((l) => l.kind === "prediction")) throw new Error(`no prediction markets in bucket: ${slug}`);

  const weightSum = legs.reduce((a, l) => a + l.weight, 0);
  let allocated = 0n;

  return legs.map((leg, i) => {
    const isLast = i === legs.length - 1;
    const amount = isLast
      ? totalUsdce - allocated
      : (totalUsdce * BigInt(Math.round((leg.weight / weightSum) * 1_000_000))) / 1_000_000n;
    allocated += amount;

    let toContractCallData: Hex;
    let toContractGasLimit: string;
    if (leg.kind === "prediction") {
      // `leg` is narrowed to PredictionLeg here by the discriminated union (no cast needed).
      toContractCallData = encodeFunctionData({
        abi: ENTER_PREDICTION_LEG_ABI,
        functionName: "enterPredictionLeg",
        args: [leg.conditionId, leg.questionId, amount, recipient],
      });
      toContractGasLimit = "500000";
    } else {
      // `leg` is narrowed to AssetLeg here.
      const minOut = opts?.minOut?.(leg, amount) ?? 0n;
      const swapData = buildExactInputSingleData({ tokenOut: leg.token, fee: leg.swapFee, amountIn: amount, minOut, recipient: enterBasket });
      toContractCallData = encodeFunctionData({
        abi: ENTER_ASSET_LEG_ABI,
        functionName: "enterAssetLeg",
        args: [amount, recipient, ADDR.swapRouter02, ADDR.swapRouter02, leg.token, minOut, swapData],
      });
      toContractGasLimit = "700000";
    }

    return {
      fromAmount: amount.toString(),
      fromTokenAddress: ADDR.usdce,
      toContractAddress: enterBasket,
      toContractCallData,
      toContractGasLimit,
      toApprovalAddress: enterBasket,
    };
  });
}
