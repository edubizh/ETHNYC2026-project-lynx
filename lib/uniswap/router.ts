import { encodeFunctionData, type Address, type Hex } from "viem";
import { ADDR } from "@/lib/addresses";

/** Uniswap V3 SwapRouter02 (IV3SwapRouter) — exactInputSingle has NO deadline (unlike the old router),
 *  and pulls tokenIn from msg.sender via a plain ERC-20 allowance, which is exactly what
 *  EnterBasket.enterAssetLeg does (`approve(spender) -> router.call(data)`). */
export const SWAP_ROUTER_02_ABI = [
  {
    type: "function",
    name: "exactInputSingle",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

/** Build SwapRouter02 calldata to swap USDC.e -> `tokenOut`, delivered to `recipient` (the EnterBasket
 *  executor, which then enforces minOut + sweeps to the user). Single-hop only: sleeve tokens are
 *  liquidity-gated to ones with a deep direct USDC.e pool. */
export function buildExactInputSingleData(p: {
  tokenOut: Address;
  fee: number;
  amountIn: bigint;
  minOut: bigint;
  recipient: Address;
}): Hex {
  return encodeFunctionData({
    abi: SWAP_ROUTER_02_ABI,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: ADDR.usdce,
        tokenOut: p.tokenOut,
        fee: p.fee,
        recipient: p.recipient,
        amountIn: p.amountIn,
        amountOutMinimum: p.minOut,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });
}
