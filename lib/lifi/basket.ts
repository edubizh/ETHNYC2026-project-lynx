import { encodeFunctionData, type Address, type Hex } from "viem";
import { ADDR } from "@/lib/addresses"; // client-safe public addresses (not the server-only config)
import { getTheme } from "@/lib/baskets/registry";
import type { PredictionLeg } from "@/lib/baskets/types";

/** Minimal ABI for the destination call LI.FI invokes per market. */
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

/** One LI.FI Composer contract call — buys a single market's neutral YES+NO set into the recipient. */
export type ContractCall = {
  fromAmount: string; // USDC.e base units (6dp) for THIS market's slice
  fromTokenAddress: Address;
  toContractAddress: Address;
  toContractCallData: Hex;
  toContractGasLimit: string;
  toApprovalAddress: Address;
};

/**
 * Split a single deposit across a bucket's prediction MARKETS per our curated strategy weights —
 * one weighted LI.FI contractCall per market (Composer splits the capital across all of them in one
 * signature). This is an INDEX ALLOCATION, not a parlay: each market is bought independently and its
 * neutral YES+NO set lands in `recipient`'s own wallet.
 *
 * Weights are re-normalized among the prediction legs (the asset leg is handled separately), and the
 * LAST market absorbs any rounding remainder so the deposit is allocated to the wei with nothing lost.
 *
 * @param slug         bucket slug (e.g. "ai")
 * @param totalUsdce   the deposit in USDC.e base units (6dp)
 * @param recipient    the end user's wallet (positions are delivered here — non-custodial)
 * @param enterBasket  the deployed EnterBasket executor address
 */
export function buildBasketContractCalls(
  slug: string,
  totalUsdce: bigint,
  recipient: Address,
  enterBasket: Address,
): ContractCall[] {
  const preds = getTheme(slug).legs.filter((l): l is PredictionLeg => l.kind === "prediction");
  if (preds.length === 0) throw new Error(`no prediction markets in bucket: ${slug}`);

  const weightSum = preds.reduce((a, l) => a + l.weight, 0);
  let allocated = 0n;

  return preds.map((leg, i) => {
    const isLast = i === preds.length - 1;
    // Scale via integer math (1e6 fixed-point) to avoid float drift; the last leg takes the remainder.
    const amount = isLast
      ? totalUsdce - allocated
      : (totalUsdce * BigInt(Math.round((leg.weight / weightSum) * 1_000_000))) / 1_000_000n;
    allocated += amount;

    const toContractCallData = encodeFunctionData({
      abi: ENTER_PREDICTION_LEG_ABI,
      functionName: "enterPredictionLeg",
      args: [leg.conditionId, leg.questionId, amount, recipient],
    });

    return {
      fromAmount: amount.toString(),
      fromTokenAddress: ADDR.usdce, // each call consumes USDC.e (LI.FI swaps native USDC -> USDC.e)
      toContractAddress: enterBasket,
      toContractCallData,
      toContractGasLimit: "500000",
      toApprovalAddress: enterBasket, // executor approves USDC.e to EnterBasket before the call
    };
  });
}
