import { getTheme, listThemes } from "@/lib/baskets/registry";

/** The four treemap timeframes, in display order. They map to Gamma volume fields in
 *  lib/mindshare-live.ts: 24h→volume24hr, 7d→volume1wk, 30d→volume1mo, 3m→volumeNum (Gamma has no
 *  90-day bucket, so 3M uses the broadest available window — effectively all-time/since-inception). */
export type Window = "24h" | "7d" | "30d" | "3m";
export const WINDOWS: Window[] = ["24h", "7d", "30d", "3m"];

/** Treemap display metrics per bucket. `mindshare` sizes the tile (share of the selected window's
 *  Polymarket volume across the bucket's belief markets — see NOTE on the securities part below);
 *  `idx` is the composite index (securities price × basket odds, via composeIdx); `change` drives the
 *  tile's up/down treatment. Live values come from lib/mindshare-live.ts; SEED is the offline fallback. */
export type Mindshare = { mindshare: number; idx: number; change: number };
export type RankedTheme = { slug: string; title: string; ms: Mindshare };
export type MindshareView = { ranked: RankedTheme[]; others: { mindshare: number; sectors: number } };
/** Ranked treemap data for every timeframe — server-computed once, toggled client-side. */
export type WindowsView = Record<Window, MindshareView>;

/** Verified display SEEDS — the graceful fallback when the live Gamma/equity feeds are unavailable. */
const SEED: Record<string, Mindshare> = {
  ai: { mindshare: 34.2, idx: 72.4, change: 3.1 },
  crypto: { mindshare: 14.6, idx: 64.8, change: 1.4 },
  "us-politics": { mindshare: 9.8, idx: 55.0, change: 0.8 },
  geopolitics: { mindshare: 8.7, idx: 47.6, change: -4.1 },
  macro: { mindshare: 6.4, idx: 41.2, change: -2.3 },
};

/** Share reserved for coming-soon sectors we don't list yet. We have no volume feed for markets we
 *  don't carry, so "Others" is a fixed documented slice; the live buckets split the remainder
 *  (100 − OTHERS_RESERVE)% proportional to their REAL measured volume. */
export const OTHERS_RESERVE = 24;
export const OTHERS_SECTORS = 3;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Composite "Index = tokenized-securities price × prediction-basket odds", as a 0–100 level.
 *  idx = 100·√(bandPercentile · beliefProb): the geometric mean of the headline security's normalized
 *  position within its analyst band and the primary belief-market odds (both 0–1). Honors the ×
 *  framing while staying readable mid-range; high only when BOTH legs are high. Approximate by design. */
export function composeIdx(bandPercentile: number, beliefProb: number): number {
  return round1(100 * Math.sqrt(clamp01(bandPercentile) * clamp01(beliefProb)));
}

export type BucketInput = { slug: string; title: string; activity: number; idx: number; change: number };

/** Pure aggregation (no I/O): size each bucket's tile by its share of total activity, scaled into the
 *  (100 − OTHERS_RESERVE)% the live buckets occupy; Others absorbs the remainder so the bar fills 100%. */
export function aggregateMindshare(buckets: BucketInput[]): MindshareView {
  const total = buckets.reduce((a, b) => a + Math.max(0, b.activity), 0);
  const scale = 100 - OTHERS_RESERVE;
  const ranked: RankedTheme[] = buckets
    .map((b) => ({
      slug: b.slug,
      title: b.title,
      ms: { mindshare: total > 0 ? round1((Math.max(0, b.activity) / total) * scale) : 0, idx: b.idx, change: b.change },
    }))
    .sort((a, b) => b.ms.mindshare - a.ms.mindshare);
  const covered = ranked.reduce((a, r) => a + r.ms.mindshare, 0);
  return { ranked, others: { mindshare: Math.max(0, round1(100 - covered)), sectors: OTHERS_SECTORS } };
}

export function getMindshare(slug: string): Mindshare {
  return SEED[slug] ?? { mindshare: 1, idx: 50, change: 0 };
}

/** Themes ordered by mindshare (desc) — the flagship is first. */
export function rankedThemes(): RankedTheme[] {
  return listThemes()
    .map((t) => ({ slug: t.slug, title: t.title, ms: getMindshare(t.slug) }))
    .sort((a, b) => b.ms.mindshare - a.ms.mindshare);
}

/** Share of activity NOT covered by the live buckets (aspirational/coming-soon sectors). */
export function othersMindshare(): { mindshare: number; sectors: number } {
  const covered = listThemes().reduce((a, t) => a + getMindshare(t.slug).mindshare, 0);
  return { mindshare: Math.max(0, round1(100 - covered)), sectors: OTHERS_SECTORS };
}

/** The verified-SEED treemap view — used as the whole-feed-down fallback in lib/mindshare-live.ts. */
export function seedMindshareView(): MindshareView {
  return { ranked: rankedThemes(), others: othersMindshare() };
}

/** Per-bucket status badge + one-line thesis shown on the dashboard header. */
export type BucketMeta = { status: string; thesis: string };
const META: Record<string, BucketMeta> = {
  ai: {
    status: "Flagship",
    thesis: "Belief markets price the AI model race and OpenAI's path to IPO; NVDA is the analyst-banded asset proxy.",
  },
  crypto: {
    status: "Demo-ready",
    thesis: "Belief odds on Bitcoin's 2026 performance vs. the on-chain asset itself — the one bucket where the asset is the theme.",
  },
  macro: {
    status: "Demo-ready",
    thesis: "The Fed rate-cut path and recession odds vs. a long-duration Treasury proxy.",
  },
  geopolitics: {
    status: "Demo-ready",
    thesis: "Conflict and leadership odds vs. defense and safe-haven anchors.",
  },
  "us-politics": {
    status: "Demo-ready",
    thesis: "The 2028 Democratic nomination race vs. policy-sensitive equities.",
  },
};
export function getBucketMeta(slug: string): BucketMeta {
  return META[slug] ?? { status: "Demo-ready", thesis: "" };
}

/** A 2-letter tile code from a bucket title (AI, CR, US, GE, MA). */
export function tileCode(slug: string): string {
  const title = getTheme(slug).title;
  const letters = title.replace(/[^A-Za-z ]/g, "").trim();
  const words = letters.split(/\s+/);
  if (title.toUpperCase().startsWith("AI")) return "AI";
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return letters.slice(0, 2).toUpperCase();
}
