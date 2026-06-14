import type { SecurityView } from "@/lib/dashboard/service";

/** One off-chain security positioned for the multi-asset analyst graph (bands + scatter views). */
export type GraphAsset = {
  ticker: string;
  name: string;
  priceUsd: number;
  /** Published analyst band the percentile is measured in. */
  low: number;
  high: number;
  /** Percentile within [low, high], 0..1 (bear=0, bull=1). */
  pct: number;
  /** Daily % change (momentum / scatter y-axis); 0 when the feed didn't supply one. */
  changePct: number;
  /** True when the security isn't buyable on our EVM/Uniswap rails (tokenized version "coming soon"). */
  comingSoon: boolean;
};

/** Pick the securities that belong on the analyst graph — those with a published band, a computed
 *  percentile, AND a price — and map them to plot-ready points, sorted by percentile (high first).
 *  On-chain LIVE-UNISWAP tokens (no band) and any security missing a price are excluded. */
export function selectGraphAssets(securities: SecurityView[]): GraphAsset[] {
  return securities
    .filter((s) => s.band != null && s.bandPercentile != null && s.priceUsd != null)
    .map((s) => ({
      ticker: s.ticker,
      name: s.name,
      priceUsd: s.priceUsd!,
      low: s.band!.low,
      high: s.band!.high,
      pct: s.bandPercentile!,
      changePct: s.changePct ?? 0,
      comingSoon: s.availability !== "LIVE-UNISWAP",
    }))
    .sort((a, b) => b.pct - a.pct);
}
