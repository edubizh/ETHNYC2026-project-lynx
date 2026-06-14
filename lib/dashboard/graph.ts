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

/** One on-chain token positioned for the On-chain Assets section. */
export type OnChainAsset = {
  ticker: string;
  name: string;
  /** Ecosystem the token primarily lives on (polygon / ethereum / solana / bittensor / chiliz / …). */
  chain: string;
  /** Market-depth badge for the token's primary venue. */
  liquidity: "high" | "medium" | "low";
  /** On-chain asset class — drives grouping/order in the list. */
  assetClass: "tokenized-equity" | "rwa" | "defi" | "major" | "memecoin";
  /** True when it's addable to the basket sleeve now (LIVE-UNISWAP on Polygon). */
  buyable: boolean;
  /** Live price when available (LIVE-UNISWAP via Uniswap); otherwise undefined. */
  priceUsd?: number;
  note?: string;
};

const CLASS_RANK: Record<OnChainAsset["assetClass"], number> = { "tokenized-equity": 1, rwa: 2, defi: 3, major: 4, memecoin: 5 };
const LIQ_RANK: Record<OnChainAsset["liquidity"], number> = { high: 3, medium: 2, low: 1 };

/** Pick the on-chain assets for the On-chain Assets list — every security carrying an `assetClass`
 *  (tokenized stocks, RWAs, DeFi/infra, majors, memecoins). Off-rail equities (no assetClass) are
 *  excluded — they live only on the analyst-band chart. Ordered securities-first by class, then buyable,
 *  then liquidity tier, then ticker. */
export function selectOnChainAssets(securities: SecurityView[]): OnChainAsset[] {
  return securities
    .filter((s): s is SecurityView & { assetClass: NonNullable<SecurityView["assetClass"]>; liquidity: NonNullable<SecurityView["liquidity"]> } => s.assetClass != null)
    .map((s) => ({
      ticker: s.ticker,
      name: s.name,
      chain: s.chain ?? "—",
      liquidity: s.liquidity ?? "low",
      assetClass: s.assetClass,
      buyable: s.availability === "LIVE-UNISWAP",
      priceUsd: s.priceUsd,
      note: s.note,
    }))
    .sort(
      (a, b) =>
        CLASS_RANK[a.assetClass] - CLASS_RANK[b.assetClass] ||
        Number(b.buyable) - Number(a.buyable) ||
        LIQ_RANK[b.liquidity] - LIQ_RANK[a.liquidity] ||
        a.ticker.localeCompare(b.ticker),
    );
}
