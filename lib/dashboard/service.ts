import { getTheme } from "@/lib/baskets/registry";
import type { PredictionLeg, AssetLeg } from "@/lib/baskets/types";
import { fetchBeliefProb } from "@/lib/adapters/polymarket";
import { fetchAssetPrice } from "@/lib/adapters/uniswap";
import { assetBandPercentile, divergence, type Divergence } from "@/lib/divergence/engine";

export type ThemeView = {
  slug: string;
  title: string;
  beliefProb: number;
  assetPrice: number;
  band: { low: number; high: number };
  divergence: Divergence;
};

export async function buildThemeView(slug: string, band: { low: number; high: number }): Promise<ThemeView> {
  const t = getTheme(slug);
  // PRIMARY prediction leg (the always-valid OpenAI-not-IPO market) drives the headline odds.
  const pred = t.legs.find((l): l is PredictionLeg => l.kind === "prediction")!;
  const asset = t.legs.find((l): l is AssetLeg => l.kind === "asset")!;
  const beliefProb = await fetchBeliefProb(pred.gammaMarketId);
  const assetPrice = await fetchAssetPrice(asset.token);
  // `band` = published analyst bear/bull targets; this is a percentile, not a probability.
  const assetBandPct = assetBandPercentile(assetPrice, band.low, band.high);
  return { slug: t.slug, title: t.title, beliefProb, assetPrice, band, divergence: divergence(beliefProb, assetBandPct) };
}
