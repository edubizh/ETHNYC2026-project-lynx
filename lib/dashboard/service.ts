import { getTheme, getSecurities, getHeadlineSecurity } from "@/lib/baskets/registry";
import type { PredictionLeg, AssetLeg, Security, Availability } from "@/lib/baskets/types";
import { fetchBeliefProb } from "@/lib/adapters/polymarket";
import { fetchAssetPrice } from "@/lib/adapters/uniswap";
import { fetchEquityPrice } from "@/lib/adapters/equities";
import { fetchAnalystBand } from "@/lib/adapters/yahoo";
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

/** Price one security: LIVE-UNISWAP (with a token) via Uniswap /quote, else via the equities feed.
 *  Falls back to the seed when the live feed is down; returns no price when neither is available. */
async function priceSecurity(sec: Security, seed: number | undefined): Promise<{ priceUsd?: number; priceSource?: Source }> {
  const viaUniswap = sec.availability === "LIVE-UNISWAP" && !!sec.token;
  try {
    const priceUsd = viaUniswap ? await fetchAssetPrice(sec.token!, { decimals: sec.decimals }) : await fetchEquityPrice(sec.ticker);
    return { priceUsd, priceSource: "live" };
  } catch {
    return seed !== undefined ? { priceUsd: seed, priceSource: "fallback" } : {};
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

export type SecurityView = {
  ticker: string;
  name: string;
  availability: Availability;
  priceUsd?: number;
  priceSource?: Source;
  /** Where the live price sits within the analyst band (the headline security drives the hero gap). */
  bandPercentile?: number;
  chain?: string;
  note?: string;
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
  /** The thematically-related securities (display/anchor + buyable LIVE-UNISWAP assets), with honest badges. */
  securities: SecurityView[];
};

/** Assemble the full theme dashboard. Belief odds come from Polymarket Gamma (live), the hero
 *  AI Sentiment Gap compares the PRIMARY leg's odds against the display equity's percentile within
 *  its published analyst band, and the asset leg shows the on-chain Uniswap /quote oracle price.
 *  Every live feed degrades gracefully to a verified seed (tagged `fallback`) so the demo always renders. */
export async function buildDashboard(slug: string): Promise<DashboardView> {
  const t = getTheme(slug);
  const predLegs = t.legs.filter(isPrediction);
  const assetLegs = t.legs.filter(isAsset);

  const predViews: LegView[] = [];
  for (const leg of predLegs) {
    const [beliefProb, beliefSource] = await withFallback(() => fetchBeliefProb(leg.gammaMarketId), leg.seedBeliefProb);
    predViews.push({ kind: "prediction", label: leg.label, weight: leg.weight, beliefProb, beliefSource });
  }

  const assetViews: LegView[] = await Promise.all(
    assetLegs.map(async (assetLeg) => {
      const [assetUsd, priceSource] = await withFallback(
        () => fetchAssetPrice(assetLeg.token, { decimals: assetLeg.decimals }),
        assetLeg.fallbackPriceUsd ?? t.display.fallback.assetLegPriceUsd,
      );
      return { kind: "asset" as const, label: assetLeg.label, weight: assetLeg.weight, priceUsd: assetUsd, priceSource };
    }),
  );

  // Price every related security, routing by availability (LIVE-UNISWAP -> Uniswap /quote, else equities feed).
  const headline = getHeadlineSecurity(slug);
  const securities: SecurityView[] = [];
  for (const sec of getSecurities(slug)) {
    const seed = sec.ticker === headline.ticker ? t.display.fallback.equityPrice : sec.priceUsd;
    const { priceUsd, priceSource: src } = await priceSecurity(sec, seed);
    const bandPercentile =
      sec.analystBand && priceUsd !== undefined
        ? assetBandPercentile(priceUsd, sec.analystBand.low, sec.analystBand.high)
        : undefined;
    securities.push({
      ticker: sec.ticker,
      name: sec.name,
      availability: sec.availability,
      priceUsd,
      priceSource: src,
      bandPercentile,
      chain: sec.chain,
      note: sec.note,
    });
  }

  // The hero gap = PRIMARY belief odds vs the HEADLINE security's percentile within its analyst band.
  const primary = predViews[0]!;
  const hv = securities.find((s) => s.ticker === headline.ticker)!;
  const equityPrice = hv.priceUsd ?? t.display.fallback.equityPrice;
  const equitySource = hv.priceSource ?? "fallback";
  // Use the live (free) Yahoo analyst band ONLY when the equity price is also live, so band and
  // price share one worldview — a live band paired with a stale fallback price can push the price
  // outside the band and yield a bogus gap. Otherwise (and for ETF/crypto headlines with no Yahoo
  // coverage) keep the hardcoded band. Per-security rows keep their own hardcoded bands.
  let band = headline.analystBand ?? t.display.analystBand;
  if (equitySource === "live") {
    [band] = await withFallback(() => fetchAnalystBand(headline.ticker), band);
  }
  // Measure the hero percentile in the SAME band shown above so the displayed band and the
  // computed gap never disagree.
  const pct = assetBandPercentile(equityPrice, band.low, band.high);
  const d = divergence(primary.beliefProb!, pct);

  return {
    slug: t.slug,
    title: t.title,
    hero: {
      beliefProb: primary.beliefProb!,
      beliefSource: primary.beliefSource!,
      assetSymbol: headline.ticker,
      equityPrice,
      equitySource,
      band,
      assetBandPercentile: pct,
      gapPct: d.gapPct,
      direction: d.direction,
    },
    legs: [...predViews, ...assetViews],
    securities,
  };
}
