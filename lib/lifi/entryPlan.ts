import type { Address } from "viem";
import { ADDR } from "@/lib/addresses";

/** Native USDC the user funds the entry with, per source chain. Polygon = the same-chain demo spine. */
export const NATIVE_USDC: Record<1 | 8453 | 137, Address> = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC (Ethereum)
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC (Base)
  137: ADDR.usdcNative, // native USDC (Polygon)
};

export type EntryMode = "same-chain" | "cross-chain";
export type EntryPlan = {
  mode: EntryMode;
  fromChainId: 1 | 8453 | 137;
  fromToken: Address;
  /** Route chips shown in the Sign step (2 same-chain, 3 cross-chain). */
  steps: string[];
};
export type EntrySelection = EntryPlan | { supported: false };

const SAME_CHAIN_STEPS = ["Swap · USDC→USDC.e", "EnterBasket · split across legs"];
const CROSS_CHAIN_STEPS = ["Swap", "Bridge · to Polygon", "EnterBasket · split across legs"];

/**
 * Pure selector: connected-wallet chain → the entry plan (LI.FI params + chips), or {supported:false}.
 * Polygon (137) is the always-on same-chain real-money spine. Ethereum (1)/Base (8453) are an
 * EXPERIMENTAL cross-chain stretch behind opts.crossChain and are currently broken-by-construction
 * (see buildEnterQuote: bridge toToken is native USDC but contract calls expect USDC.e) — keep
 * opts.crossChain false for any real-money demo. Everything else (incl. Arc, undefined) is unsupported.
 */
export function planEntry(chainId: number | undefined, opts?: { crossChain?: boolean }): EntrySelection {
  if (chainId === 137) {
    return { mode: "same-chain", fromChainId: 137, fromToken: NATIVE_USDC[137], steps: SAME_CHAIN_STEPS };
  }
  if ((chainId === 1 || chainId === 8453) && opts?.crossChain) {
    return { mode: "cross-chain", fromChainId: chainId, fromToken: NATIVE_USDC[chainId], steps: CROSS_CHAIN_STEPS };
  }
  return { supported: false };
}
