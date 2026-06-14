// Theme Conviction Index — a principled, liquidity-and-relevance-weighted aggregate of a theme's
// prediction markets (Polymarket buyable legs + non-buyable + Kalshi) into one honest belief RANGE.
// Pure: callers resolve each market's live prob + volume (with seed fallback) and pass them in.

export type BeliefInput = {
  id: string;
  label?: string;
  venue: "polymarket" | "kalshi";
  /** Live YES probability in [0,1]. */
  prob: number;
  /** +1: YES is bullish-for-theme; -1: YES is bearish (use 1 − prob). */
  polarity: 1 | -1;
  /** Curated thematic relevance in (0,1]; 0 (or negative) drops the market. */
  relevance: number;
  /** Liquidity proxy (venue-native units: Polymarket USDC volume, Kalshi contracts + OI). */
  volume: number;
  /** Provenance, passed through for the UI; ignored by the math. */
  source?: "live" | "fallback";
};

export type BeliefContribution = {
  id: string;
  label?: string;
  venue: string;
  /** Oriented probability (polarity applied). */
  q: number;
  /** Normalized weight share in [0,1] (sums to 1 across contributions). */
  weight: number;
  prob: number;
  polarity: 1 | -1;
  relevance: number;
  volume: number;
  source?: "live" | "fallback";
};

export type Belief = {
  /** The belief RANGE: low ≤ center ≤ high, all in [0,1]. */
  low: number;
  center: number;
  high: number;
  /** 0..1, higher = tighter/more-backed range. */
  confidence: number;
  /** Kish effective independent market count. */
  nEff: number;
  breakdown: BeliefContribution[];
};

// --- tunable constants (pinned by tests; refined against live data) ---
const VBAR: Record<string, number> = { polymarket: 25_000, kalshi: 25_000 }; // fixed per-venue liquidity scale
const Z = 1.0; // range half-width multiplier
const W0 = 3; // conviction-mass scale at which intrinsic uncertainty has shrunk ~30%
const INT_COEF = 0.3; // weight of intrinsic (near-50/50) uncertainty
const MIN_HALF = 0.015; // always render as a visible band
const MAX_HALF = 0.45;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Aggregate belief inputs into a center + range. See module header for the model. */
export function computeBelief(inputs: BeliefInput[]): Belief {
  const usable = inputs.filter((i) => i.relevance > 0 && Number.isFinite(i.prob) && i.prob >= 0 && i.prob <= 1);
  if (usable.length === 0) {
    return { low: 0, center: 0.5, high: 1, confidence: 0, nEff: 0, breakdown: [] };
  }

  // Orient + weight: wᵢ = relevanceᵢ · (1 + ln(1 + Vᵢ/V̄_venue)). The "1 +" floor keeps relevance
  // meaningful when volume is 0 (offline seeds); the log compresses so one whale market can't dominate.
  const rows = usable.map((i) => {
    const q = i.polarity === 1 ? i.prob : 1 - i.prob;
    const vbar = VBAR[i.venue] ?? 25_000;
    const weight = i.relevance * (1 + Math.log(1 + Math.max(0, i.volume) / vbar));
    return { i, q, weight };
  });

  const W = rows.reduce((a, r) => a + r.weight, 0);
  const center = rows.reduce((a, r) => a + r.weight * r.q, 0) / W;

  // Disagreement across markets (liquidity-weighted std-dev), tempered by the effective independent count.
  const variance = rows.reduce((a, r) => a + r.weight * (r.q - center) ** 2, 0) / W;
  const sigmaW = Math.sqrt(variance);
  const sumW2 = rows.reduce((a, r) => a + r.weight ** 2, 0);
  const nEff = (W * W) / sumW2;

  // Intrinsic uncertainty: widest near 50/50, shrinking as conviction mass W grows.
  const sigmaInt = (INT_COEF * Math.sqrt(center * (1 - center))) / Math.sqrt(1 + W / W0);

  const rawHalf = Z * Math.sqrt((sigmaW * sigmaW) / nEff + sigmaInt * sigmaInt);
  const half = Math.min(MAX_HALF, Math.max(MIN_HALF, rawHalf));

  const breakdown: BeliefContribution[] = rows.map((r) => ({
    id: r.i.id,
    label: r.i.label,
    venue: r.i.venue,
    q: r.q,
    weight: r.weight / W,
    prob: r.i.prob,
    polarity: r.i.polarity,
    relevance: r.i.relevance,
    volume: r.i.volume,
    source: r.i.source,
  }));

  return {
    low: clamp01(center - half),
    center,
    high: clamp01(center + half),
    confidence: clamp01(1 - 2 * half),
    nEff,
    breakdown,
  };
}
