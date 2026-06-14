import type { Address } from "viem";
import { getTheme } from "@/lib/baskets/registry";
import type { AssetLeg } from "@/lib/baskets/types";
import { buildBasketContractCalls, type ContractCall } from "@/lib/lifi/basket";
import { resolveAssetMinOuts } from "@/lib/lifi/assetQuotes";

/** SERVER-ONLY (imports assetQuotes -> the Uniswap adapter -> lib/config). Resolve a REAL Uniswap /quote
 *  slippage floor for every asset leg, then build the LI.FI Composer calls. THROWS if any asset leg can't
 *  be priced (floor 0) — we never ship an unprotected (amountOutMinimum = 0) swap on real funds.
 *  Do NOT import this from a "use client" component; call it via the /api/basket-entry route. */
export async function buildSafeBasketContractCalls(
  slug: string,
  totalUsdce: bigint,
  recipient: Address,
  enterBasket: Address,
  slippage = 0.01,
): Promise<ContractCall[]> {
  const legs = getTheme(slug).legs;
  const weightSum = legs.reduce((a, l) => a + l.weight, 0);
  const assetLegs = legs.filter((l): l is AssetLeg => l.kind === "asset");
  const amountFor = (leg: AssetLeg) => (totalUsdce * BigInt(Math.round((leg.weight / weightSum) * 1_000_000))) / 1_000_000n;
  const minOut = await resolveAssetMinOuts(assetLegs, amountFor, slippage);
  for (const leg of assetLegs) {
    if (minOut(leg, amountFor(leg)) <= 0n) {
      throw new Error(`No Uniswap price for ${leg.ticker}; refusing to build an unprotected asset-leg swap`);
    }
  }
  return buildBasketContractCalls(slug, totalUsdce, recipient, enterBasket, { minOut });
}
