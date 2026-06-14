import { fetchAssetPriceFresh } from "@/lib/adapters/uniswap";
import type { AssetLeg } from "@/lib/baskets/types";

/** Convert a USDC.e input amount (6dp) into a slippage-floored minimum token output (token base units),
 *  using the Uniswap /quote USD price for 1 whole token (sized by leg.decimals; WBTC=8dp). The floor
 *  ASSUMES USDC.e ≈ $1 (true within pennies on Polygon) and is computed in PURE BIGINT — integer
 *  division truncates DOWN, so the floor is never over-stated on real funds. (A float path would round
 *  the >1e15-wei result UP past Number.MAX_SAFE_INTEGER and could set minAmountOut above the true floor,
 *  reverting a valid swap.) Uses the UNCACHED fetchAssetPriceFresh — a stale display price must never set
 *  an on-chain minAmountOut. The deployed EnterBasket also enforces this minAmountOut on-chain (defense in
 *  depth). Returns 0n if the quote feed is unavailable; buildSafeBasketContractCalls (basketEntry.ts)
 *  REFUSES to ship a 0-floor swap on real funds. */
export async function resolveAssetMinOut(leg: AssetLeg, amountUsdce: bigint, slippage: number): Promise<bigint> {
  try {
    const priceUsd = await fetchAssetPriceFresh(leg.token, { decimals: leg.decimals }); // fresh USD per 1 token
    if (!(priceUsd > 0)) return 0n;
    const decimals = BigInt(leg.decimals ?? 18);
    // tokenOut = amountUsdce(6dp) / priceMicro(6dp per token) * 10^decimals, less slippage (bps). Carry the
    // price as integer micro-USDC so the whole computation is integer division (always floors). Only the
    // price→micro conversion is float-rounded, which can't inflate the floor past the exact rational value.
    const priceMicro = BigInt(Math.round(priceUsd * 1e6)); // USDC.e (6dp) per 1 whole token
    if (priceMicro <= 0n) return 0n;
    const slippageBps = BigInt(Math.round(slippage * 10_000));
    return (amountUsdce * 10n ** decimals * (10_000n - slippageBps)) / (priceMicro * 10_000n);
  } catch {
    return 0n;
  }
}

/** Build the per-leg minOut closure for buildBasketContractCalls by pre-resolving all sleeve quotes. */
export async function resolveAssetMinOuts(
  legs: AssetLeg[],
  amountFor: (leg: AssetLeg) => bigint,
  slippage = 0.01,
): Promise<(leg: AssetLeg, amount: bigint) => bigint> {
  const entries = await Promise.all(legs.map(async (l) => [l.token, await resolveAssetMinOut(l, amountFor(l), slippage)] as const));
  const byToken = new Map(entries);
  return (leg) => byToken.get(leg.token) ?? 0n;
}
