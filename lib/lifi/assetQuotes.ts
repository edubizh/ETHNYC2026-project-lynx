import { fetchAssetPrice } from "@/lib/adapters/uniswap";
import type { AssetLeg } from "@/lib/baskets/types";

/** Convert a USDC.e input amount (6dp) into a slippage-floored minimum token output (token base units),
 *  using the Uniswap /quote USD price for 1 whole token. Returns 0n if the quote feed is unavailable —
 *  the swap still executes and EnterBasket.enterAssetLeg's on-chain minAmountOut (also passed) plus the
 *  pool itself bound the downside; 0n just means "no extra off-chain floor this run". */
export async function resolveAssetMinOut(leg: AssetLeg, amountUsdce: bigint, slippage: number): Promise<bigint> {
  try {
    const priceUsd = await fetchAssetPrice(leg.token, { decimals: leg.decimals }); // USD per 1 token
    if (!(priceUsd > 0)) return 0n;
    const decimals = leg.decimals ?? 18;
    const usdcHuman = Number(amountUsdce) / 1e6; // USDC.e is 6dp
    const tokenOut = (usdcHuman / priceUsd) * (1 - slippage); // whole tokens, floored by slippage
    return BigInt(Math.floor(tokenOut * 10 ** decimals));
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
