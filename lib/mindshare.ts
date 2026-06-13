import { getTheme, listThemes } from "@/lib/baskets/registry";

/** Treemap display metrics per bucket. `mindshare` sizes the tile (share of 24h activity across the
 *  bucket's belief markets + tokenized securities); `idx` is the composite index (securities price ×
 *  basket odds); `change` drives the tile's up/down treatment.
 *  NOTE: these are display SEEDS for now — wire to real 24h activity later. */
export type Mindshare = { mindshare: number; idx: number; change: number };

const SEED: Record<string, Mindshare> = {
  ai: { mindshare: 34.2, idx: 72.4, change: 3.1 },
  crypto: { mindshare: 14.6, idx: 64.8, change: 1.4 },
  "us-politics": { mindshare: 9.8, idx: 55.0, change: 0.8 },
  geopolitics: { mindshare: 8.7, idx: 47.6, change: -4.1 },
  macro: { mindshare: 6.4, idx: 41.2, change: -2.3 },
};

export function getMindshare(slug: string): Mindshare {
  return SEED[slug] ?? { mindshare: 1, idx: 50, change: 0 };
}

/** Themes ordered by mindshare (desc) — the flagship is first. */
export function rankedThemes(): Array<{ slug: string; title: string; ms: Mindshare }> {
  return listThemes()
    .map((t) => ({ slug: t.slug, title: t.title, ms: getMindshare(t.slug) }))
    .sort((a, b) => b.ms.mindshare - a.ms.mindshare);
}

/** Share of activity NOT covered by the live buckets (aspirational/coming-soon sectors). */
export function othersMindshare(): { mindshare: number; sectors: number } {
  const covered = listThemes().reduce((a, t) => a + getMindshare(t.slug).mindshare, 0);
  return { mindshare: Math.max(0, Math.round((100 - covered) * 10) / 10), sectors: 3 };
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
