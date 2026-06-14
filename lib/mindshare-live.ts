import {
  WINDOWS,
  aggregateMindshare,
  composeIdx,
  getMindshare,
  seedMindshareView,
  type Window,
  type BucketInput,
  type WindowsView,
} from "@/lib/mindshare";
import { listThemes, getHeadlineSecurity } from "@/lib/baskets/registry";
import type { PredictionLeg, Theme } from "@/lib/baskets/types";
import { fetchMarketVolumes, fetchBeliefProb } from "@/lib/adapters/polymarket";
import { fetchEquityQuote } from "@/lib/adapters/equities";
import { assetBandPercentile } from "@/lib/divergence/engine";

// SERVER-ONLY: imports the adapters (and transitively lib/config, which hard-fails without an API key).
// Never import this from a "use client" component — the client uses the pure lib/mindshare exports.

const ZERO: Record<Window, number> = { "24h": 0, "7d": 0, "30d": 0, "3m": 0 };

/** Resilient single-feed wrapper — copies the graceful-fallback pattern from lib/dashboard/service.ts. */
async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

type BucketLive = { slug: string; title: string; volumes: Record<Window, number>; idx: number; change: number };

/** Live per-window activity + idx/change for one bucket. Each feed degrades independently to a seed:
 *  a single dead prediction leg contributes 0 volume (others still count); the equity feed falling back
 *  yields the seed price + seed change (so crypto/no-feed headlines stay sensible). */
async function buildBucketLive(theme: Theme): Promise<BucketLive> {
  const predLegs = theme.legs.filter((l): l is PredictionLeg => l.kind === "prediction");
  const primary = predLegs[0]!; // registry guarantees ≥1 prediction leg per bucket
  const seed = getMindshare(theme.slug);
  const headline = getHeadlineSecurity(theme.slug);
  const band = headline.analystBand ?? theme.display.analystBand;

  const [legVolumes, beliefProb, quote] = await Promise.all([
    Promise.all(predLegs.map((leg) => withFallback(() => fetchMarketVolumes(leg.gammaMarketId), ZERO))),
    withFallback(() => fetchBeliefProb(primary.gammaMarketId), primary.seedBeliefProb),
    withFallback(() => fetchEquityQuote(headline.ticker), { price: theme.display.fallback.equityPrice, changePct: seed.change }),
  ]);

  const volumes: Record<Window, number> = { ...ZERO };
  for (const v of legVolumes) for (const w of WINDOWS) volumes[w] += v[w];

  const bandPct = assetBandPercentile(quote.price, band.low, band.high);
  return { slug: theme.slug, title: theme.title, volumes, idx: composeIdx(bandPct, beliefProb), change: quote.changePct };
}

/** Build ranked treemap data for ALL four timeframes in one server pass. Tile size = the bucket's share
 *  of that window's Polymarket belief-market volume (the off-rail securities have no clean 24h on-chain
 *  volume, so belief-market volume is the proxy — see fetchMarketVolumes). idx/change come from the
 *  headline security's band-percentile × primary belief odds and the equity's daily %change; both are
 *  window-independent (size is the per-window signal). If a window has NO live volume (e.g. Gamma down),
 *  it falls back to the verified seedMindshareView() so the page always renders. */
export async function buildMindshareWindows(): Promise<WindowsView> {
  const live = await Promise.all(listThemes().map(buildBucketLive));
  const seed = seedMindshareView();

  const out = {} as WindowsView;
  for (const w of WINDOWS) {
    const total = live.reduce((a, b) => a + b.volumes[w], 0);
    if (total <= 0) {
      out[w] = { ...seed, source: "fallback" };
      continue;
    }
    const inputs: BucketInput[] = live.map((b) => ({ slug: b.slug, title: b.title, activity: b.volumes[w], idx: b.idx, change: b.change }));
    out[w] = { ...aggregateMindshare(inputs), source: "live" };
  }
  return out;
}
