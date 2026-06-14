import { NextResponse } from "next/server";
import { getTheme } from "@/lib/baskets/registry";
import type { AssetLeg } from "@/lib/baskets/types";
import { fetchAssetPrice } from "@/lib/adapters/uniswap";

export const dynamic = "force-dynamic";

/** Live USD prices for a theme's buyable basket assets via the Uniswap /quote oracle.
 *  Falls back to the per-leg seed price when the live quote is unavailable, so the ticker always renders. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  let theme;
  try {
    theme = getTheme(slug);
  } catch {
    return NextResponse.json({ prices: [] });
  }

  const assets = theme.legs.filter((l): l is AssetLeg => l.kind === "asset");
  const seen = new Set<string>();
  const uniq = assets.filter((a) => (seen.has(a.ticker) ? false : (seen.add(a.ticker), true)));

  const prices = await Promise.all(
    uniq.map(async (a) => {
      try {
        return { ticker: a.ticker, usd: await fetchAssetPrice(a.token, { decimals: a.decimals }) };
      } catch {
        return { ticker: a.ticker, usd: a.fallbackPriceUsd ?? theme.display.fallback.assetLegPriceUsd };
      }
    }),
  );

  return NextResponse.json({ prices });
}
