import { getTheme } from "@/lib/baskets/registry";
import type { PredictionLeg, AssetLeg } from "@/lib/baskets/types";
import { fetchBeliefProb } from "@/lib/adapters/polymarket";
import { fetchAssetPrice } from "@/lib/adapters/uniswap";
import { fetchEquityPrice } from "@/lib/adapters/equities";
import { assetBandPercentile, divergence, type Divergence } from "@/lib/divergence/engine";

const isPrediction = (l: PredictionLeg | AssetLeg): l is PredictionLeg => l.kind === "prediction";
const isAsset = (l: PredictionLeg | AssetLeg): l is AssetLeg => l.kind === "asset";

export type ThemeView = {
  slug: string;
  title: string;
  beliefProb: number;
  assetPrice: number;
  band: { low: number; high: number };
  divergence: Divergence;
};

/** Pure composition of a theme view from already-fetched inputs (no I/O). */
export function composeThemeView(
  meta: { slug: string; title: string },
  beliefProb: number,
  assetPrice: number,
  band: { low: number; high: number },
): ThemeView {
  const assetBandPct = assetBandPercentile(assetPrice, band.low, band.high);
  return { slug: meta.slug, title: meta.title, beliefProb, assetPrice, band, divergence: divergence(beliefProb, assetBandPct) };
}

export async function buildThemeView(slug: string, band: { low: number; high: number }): Promise<ThemeView> {
  const t = getTheme(slug);
  // PRIMARY prediction leg (the always-valid OpenAI-not-IPO market) drives the headline odds.
  const pred = t.legs.find(isPrediction)!;
  const asset = t.legs.find(isAsset)!;
  const beliefProb = await fetchBeliefProb(pred.gammaMarketId);
  const assetPrice = await fetchAssetPrice(asset.token);
  return composeThemeView({ slug: t.slug, title: t.title }, beliefProb, assetPrice, band);
}

// --- resilient dashboard composer (graceful fallback to verified seeds when a live feed is down) ---

type Source = "live" | "fallback";

async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<[T, Source]> {
  try {
    return [await fn(), "live"];
  } catch {
    return [fallback, "fallback"];
  }
}

export type LegView = {
  kind: "prediction" | "asset";
  label: string;
  weight: number;
  beliefProb?: number;
  beliefSource?: Source;
  priceUsd?: number;
  priceSource?: Source;
};

export type DashboardView = {
  slug: string;
  title: string;
  hero: {
    beliefProb: number;
    beliefSource: Source;
    assetSymbol: string;
    equityPrice: number;
    equitySource: Source;
    band: { low: number; high: number };
    assetBandPercentile: number;
    gapPct: number;
    direction: Divergence["direction"];
  };
  legs: LegView[];
};

/** Assemble the full theme dashboard. Belief odds come from Polymarket Gamma (live), the hero
 *  AI Sentiment Gap compares the PRIMARY leg's odds against the display equity's percentile within
 *  its published analyst band, and the asset leg shows the on-chain Uniswap /quote oracle price.
 *  Every live feed degrades gracefully to a verified seed (tagged `fallback`) so the demo always renders. */
export async function buildDashboard(slug: string): Promise<DashboardView> {
  const t = getTheme(slug);
  const predLegs = t.legs.filter(isPrediction);
  const assetLeg = t.legs.find(isAsset)!;

  const predViews: LegView[] = [];
  for (const leg of predLegs) {
    const [beliefProb, beliefSource] = await withFallback(() => fetchBeliefProb(leg.gammaMarketId), leg.seedBeliefProb);
    predViews.push({ kind: "prediction", label: leg.label, weight: leg.weight, beliefProb, beliefSource });
  }

  const [assetUsd, priceSource] = await withFallback(
    () => fetchAssetPrice(assetLeg.token),
    t.display.fallback.assetLegPriceUsd,
  );
  const assetView: LegView = { kind: "asset", label: assetLeg.label, weight: assetLeg.weight, priceUsd: assetUsd, priceSource };

  const primary = predViews[0]!;
  const band = t.display.analystBand;
  const [equityPrice, equitySource] = await withFallback(
    () => fetchEquityPrice(t.display.assetSymbol),
    t.display.fallback.equityPrice,
  );
  const pct = assetBandPercentile(equityPrice, band.low, band.high);
  const d = divergence(primary.beliefProb!, pct);

  return {
    slug: t.slug,
    title: t.title,
    hero: {
      beliefProb: primary.beliefProb!,
      beliefSource: primary.beliefSource!,
      assetSymbol: t.display.assetSymbol,
      equityPrice,
      equitySource,
      band,
      assetBandPercentile: pct,
      gapPct: d.gapPct,
      direction: d.direction,
    },
    legs: [...predViews, assetView],
  };
}
