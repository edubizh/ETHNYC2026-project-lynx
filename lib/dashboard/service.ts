import { getTheme, getSecurities, getHeadlineSecurity } from "@/lib/baskets/registry";
import type { PredictionLeg, AssetLeg, Security, Availability, Liquidity, Theme, BeliefMarket } from "@/lib/baskets/types";
import { fetchBeliefProb, fetchMarketVolumes } from "@/lib/adapters/polymarket";
import { fetchAssetPrice } from "@/lib/adapters/uniswap";
import { fetchEquityQuote } from "@/lib/adapters/equities";
import { fetchAnalystBand } from "@/lib/adapters/yahoo";
import { fetchKalshiOdds } from "@/lib/adapters/kalshi";
import { computeBelief, type Belief, type BeliefInput } from "@/lib/belief/engine";
import { assetBandPercentile, divergence, gapVsRange, type Divergence } from "@/lib/divergence/engine";

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
 *  Equities also yield `changePct` (daily momentum) for the scatter view; Uniswap quotes don't.
 *  Falls back to the seed when the live feed is down; returns no price when neither is available. */
async function priceSecurity(sec: Security, seed: number | undefined): Promise<{ priceUsd?: number; priceSource?: Source; changePct?: number }> {
  const viaUniswap = sec.availability === "LIVE-UNISWAP" && !!sec.token;
  // On-chain "coming soon" tokens (liquidity-tagged, not buyable) aren't on the equities feed and we
  // don't live-price them — use the curated seed (usually none) rather than mis-querying equities with a
  // crypto ticker. LIVE-UNISWAP tokens still price via Uniswap; equities still price via the equity feed.
  const offRailToken = sec.availability !== "LIVE-UNISWAP" && sec.liquidity != null;
  try {
    if (viaUniswap) {
      const priceUsd = await fetchAssetPrice(sec.token!, { decimals: sec.decimals });
      return { priceUsd, priceSource: "live" };
    }
    if (offRailToken) {
      return seed !== undefined ? { priceUsd: seed, priceSource: "fallback" } : {};
    }
    const q = await fetchEquityQuote(sec.ticker);
    return { priceUsd: q.price, priceSource: "live", changePct: q.changePct };
  } catch {
    return seed !== undefined ? { priceUsd: seed, priceSource: "fallback" } : {};
  }
}

// --- crowd-belief aggregation (Theme Conviction Index across Polymarket + Kalshi) ---

const DEFAULT_LEG_POLARITY: 1 | -1 = 1;
const DEFAULT_LEG_RELEVANCE = 0.6;

/** One Polymarket belief input: live YES odds (cached, dedups with the leg view) + total volume, seed fallback. */
async function polymarketBeliefInput(
  id: string,
  label: string,
  polarity: 1 | -1,
  relevance: number,
  seedProb: number,
  seedVolume: number,
): Promise<BeliefInput> {
  const [prob, source] = await withFallback(() => fetchBeliefProb(id), seedProb);
  let volume = seedVolume;
  try {
    volume = (await fetchMarketVolumes(id))["3m"] || seedVolume;
  } catch {
    /* keep seed volume */
  }
  return { id, label, venue: "polymarket", prob, polarity, relevance, volume, source };
}

/** One Kalshi belief input: live YES odds + (volume + open interest) as liquidity, seed fallback. */
async function kalshiBeliefInput(m: BeliefMarket): Promise<BeliefInput> {
  try {
    const o = await fetchKalshiOdds(m.id);
    return { id: m.id, label: m.label, venue: "kalshi", prob: o.prob, polarity: m.polarity, relevance: m.relevance, volume: o.volume + o.openInterest, source: "live" };
  } catch {
    return { id: m.id, label: m.label, venue: "kalshi", prob: m.seedProb, polarity: m.polarity, relevance: m.relevance, volume: m.seedVolume ?? 0, source: "fallback" };
  }
}

/** The theme's crowd-belief range: pool the buyable prediction legs with the curated extra belief markets
 *  (Polymarket + Kalshi), fetch each live (cached) with a seed fallback, and run the conviction engine. */
async function buildBelief(t: Theme): Promise<Belief> {
  const legInputs = t.legs
    .filter(isPrediction)
    .map((leg) =>
      polymarketBeliefInput(
        leg.gammaMarketId,
        leg.label,
        leg.polarity ?? DEFAULT_LEG_POLARITY,
        leg.relevance ?? DEFAULT_LEG_RELEVANCE,
        leg.seedBeliefProb,
        leg.seedVolume ?? 0,
      ),
    );
  const extraInputs = (t.display.beliefMarkets ?? []).map((m) =>
    m.venue === "kalshi" ? kalshiBeliefInput(m) : polymarketBeliefInput(m.id, m.label, m.polarity, m.relevance, m.seedProb, m.seedVolume ?? 0),
  );
  return computeBelief(await Promise.all([...legInputs, ...extraInputs]));
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
  /** On-chain market-depth badge (high/medium/low) for tokenized assets; undefined for equities. */
  liquidity?: Liquidity;
  priceUsd?: number;
  priceSource?: Source;
  /** Where the live price sits within the analyst band (the headline security drives the hero gap). */
  bandPercentile?: number;
  /** The analyst band the percentile was measured in (bear=low, bull=high) — feeds the multi-asset graph. */
  band?: { low: number; high: number };
  /** Daily % change (momentum) from the equities feed; only set for equities-priced securities. */
  changePct?: number;
  chain?: string;
  note?: string;
};

export type DashboardView = {
  slug: string;
  title: string;
  hero: {
    /** The crowd-belief CENTER (aggregate of all theme markets) — kept for back-compat / the headline %. */
    beliefProb: number;
    /** The full crowd-belief RANGE: low ≤ center ≤ high, in [0,1]. */
    belief: { low: number; center: number; high: number };
    beliefConfidence: number;
    /** Per-market contributions (oriented prob + weight share + venue) for the belief tooltip. */
    beliefBreakdown: { label?: string; venue: string; q: number; weight: number; source?: Source }[];
    beliefSource: Source;
    /** Summary of what fed the belief (e.g. "5 markets · polymarket + kalshi"). */
    beliefLabel: string;
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

  const headline = getHeadlineSecurity(slug);

  // Fetch belief legs, asset legs, and related securities CONCURRENTLY (independent feeds; the adapter
  // cache also dedups overlaps like WETH priced as both an asset leg and a security). Order preserved by map.
  const [predViews, assetViews, securities, belief] = await Promise.all([
    Promise.all(
      predLegs.map(async (leg): Promise<LegView> => {
        const [beliefProb, beliefSource] = await withFallback(() => fetchBeliefProb(leg.gammaMarketId), leg.seedBeliefProb);
        return { kind: "prediction", label: leg.label, weight: leg.weight, beliefProb, beliefSource };
      }),
    ),
    Promise.all(
      assetLegs.map(async (assetLeg): Promise<LegView> => {
        const [assetUsd, priceSource] = await withFallback(
          () => fetchAssetPrice(assetLeg.token, { decimals: assetLeg.decimals }),
          assetLeg.fallbackPriceUsd ?? t.display.fallback.assetLegPriceUsd,
        );
        return { kind: "asset", label: assetLeg.label, weight: assetLeg.weight, priceUsd: assetUsd, priceSource };
      }),
    ),
    // Price every related security AND resolve its analyst band: prefer the LIVE Yahoo band when the price
    // is also live (band & price share one worldview — kills the stale-band 0th/100th pinning); ETFs/crypto
    // keep the hardcoded band. This same per-security band drives BOTH the multi-asset graph and (for the
    // headline) the hero gap, so they can never disagree on screen.
    Promise.all(
      getSecurities(slug).map(async (sec): Promise<SecurityView> => {
        const seed = sec.ticker === headline.ticker ? t.display.fallback.equityPrice : sec.priceUsd;
        const { priceUsd, priceSource: src, changePct } = await priceSecurity(sec, seed);
        let band = sec.analystBand;
        if (band && priceUsd !== undefined && src === "live") {
          [band] = await withFallback(() => fetchAnalystBand(sec.ticker), band);
        }
        const bandPercentile = band && priceUsd !== undefined ? assetBandPercentile(priceUsd, band.low, band.high) : undefined;
        return {
          ticker: sec.ticker,
          name: sec.name,
          availability: sec.availability,
          liquidity: sec.liquidity,
          priceUsd,
          priceSource: src,
          bandPercentile,
          band,
          changePct,
          chain: sec.chain,
          note: sec.note,
        };
      }),
    ),
    buildBelief(t),
  ]);

  // Headline security's band percentile — read straight off its SecurityView so the hero and the graph
  // row for the same ticker always show the identical band.
  const hv = securities.find((s) => s.ticker === headline.ticker)!;
  const equityPrice = hv.priceUsd ?? t.display.fallback.equityPrice;
  const equitySource = hv.priceSource ?? "fallback";
  const band = hv.band ?? headline.analystBand ?? t.display.analystBand;
  const pct = hv.bandPercentile ?? assetBandPercentile(equityPrice, band.low, band.high);

  // The Sentiment Gap is now measured against the crowd-belief RANGE (0 if the asset sits inside it).
  const g = gapVsRange(belief.low, belief.high, pct);
  const venues = Array.from(new Set(belief.breakdown.map((b) => b.venue)));
  const beliefSource: Source = belief.breakdown.some((b) => b.source === "live") ? "live" : "fallback";
  const beliefLabel = belief.breakdown.length ? `${belief.breakdown.length} markets · ${venues.join(" + ")}` : "no markets";

  return {
    slug: t.slug,
    title: t.title,
    hero: {
      beliefProb: belief.center,
      belief: { low: belief.low, center: belief.center, high: belief.high },
      beliefConfidence: belief.confidence,
      beliefBreakdown: belief.breakdown.map((b) => ({ label: b.label, venue: b.venue, q: b.q, weight: b.weight, source: b.source })),
      beliefSource,
      beliefLabel,
      assetSymbol: headline.ticker,
      equityPrice,
      equitySource,
      band,
      assetBandPercentile: pct,
      gapPct: g.gapPct,
      direction: g.direction,
    },
    legs: [...predViews, ...assetViews],
    securities,
  };
}
