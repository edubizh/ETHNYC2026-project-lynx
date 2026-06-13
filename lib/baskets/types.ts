export type PredictionLeg = {
  kind: "prediction";
  label: string;
  /** Polymarket Gamma numeric market id (for the odds adapter). */
  gammaMarketId: string;
  conditionId: `0x${string}`;
  /** The NegRisk QUESTION id — drives NegRiskAdapter.getPositionId(questionId, true/false). */
  questionId: `0x${string}`;
  /** Verified ERC-1155 outcome-token ids. Equal to NegRiskAdapter.getPositionId(questionId,bool)
   *  AND to the Gamma clobTokenIds (confirmed exactly on-chain 2026-06-13). Used for portfolio/NAV reads. */
  outcomeTokenIds: { yes: string; no: string };
  /** Verified live YES odds (Gamma outcomePrices) — seed used for the offline/no-key demo. */
  seedBeliefProb: number;
  weight: number;
};
export type AssetLeg = { kind: "asset"; label: string; token: `0x${string}`; weight: number };
export type Leg = PredictionLeg | AssetLeg;

/** Whether a thematically-related security can actually be traded on Uniswap, or is shown for context only.
 *  As of 2026 no tokenized stock is openly Uniswap-tradeable by a US/ungated user, so equities are display-only. */
export type Availability = "LIVE-UNISWAP" | "TOKENIZED-BUT-GATED" | "NO-TOKENIZED-VERSION";

/** A tokenized real-world security thematically tied to a bucket. Display/anchor layer — NOT bought in-app.
 *  Each carries an availability tag so the UI renders an honest badge instead of implying a buy. */
export type Security = {
  ticker: string;
  name: string;
  /** Display spot price (equities feed for stocks; Uniswap /quote for on-chain assets). */
  priceUsd?: number;
  /** Published analyst bear/bull band (bear=low, bull=high) — drives the headline security's percentile. */
  analystBand?: { low: number; high: number };
  availability: Availability;
  /** Where the tokenized form (if any) lives, e.g. "solana", "polygon". */
  chain?: string;
  /** Honest one-liner on tradeability / gating, surfaced in the badge tooltip. */
  note?: string;
};

export type ThemeDisplay = {
  /** Display-only equity whose published analyst band drives the hero "AI Sentiment Gap".
   *  Must match one entry in `securities` (the headline security). */
  assetSymbol: string;
  /** Published analyst bear/bull price-target band, surfaced in the UI (bear=low, bull=high). */
  analystBand: { low: number; high: number };
  /** Seed values used when a live feed is unavailable (no key / offline demo). */
  fallback: { beliefProb: number; equityPrice: number; assetLegPriceUsd: number };
  /** Thematically-related securities shown inside the bucket (display/anchor layer). */
  securities: Security[];
};

export type Theme = { slug: string; title: string; legs: Leg[]; display: ThemeDisplay };
