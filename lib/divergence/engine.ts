/** Where the live asset price sits within a PUBLISHED analyst bear/bull band, as a [0,1] percentile.
 *  This is NOT an "implied probability" — it's the asset's position in [low,high] (bear=low, bull=high),
 *  clamped. The band [low,high] are the surfaced bear/bull price targets, shown in the view. */
export function assetBandPercentile(price: number, low: number, high: number): number {
  if (high <= low) throw new Error("high must exceed low");
  return Math.min(1, Math.max(0, (price - low) / (high - low)));
}

export type Divergence = {
  beliefProb: number;
  /** The asset's percentile within the published analyst band (NOT a probability). */
  assetBandPercentile: number;
  /** The "AI Sentiment Gap": the unsigned distance (percentage points) between belief-market odds and the
   *  asset's analyst-band percentile. A DIVERGENCE/attention indicator — NOT a probability, edge, or advice. */
  gapPct: number;
  direction: "belief-higher" | "asset-higher" | "aligned";
};

export function divergence(beliefProb: number, assetBandPct: number): Divergence {
  const gapPct = (beliefProb - assetBandPct) * 100;
  const direction = Math.abs(gapPct) < 1 ? "aligned" : gapPct > 0 ? "belief-higher" : "asset-higher";
  return { beliefProb, assetBandPercentile: assetBandPct, gapPct: Math.abs(gapPct), direction };
}
