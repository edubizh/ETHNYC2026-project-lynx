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

/** Whether a security is buyable on our EVM/Uniswap rails, or shown as the (off-rail) analyst anchor.
 *  We stay EVM-only and conform to the sponsors (Uniswap/LI.FI), so single-name tokenized stocks — which
 *  have no EVM/Uniswap venue (they live on Solana/CEX/issuer rails) — are DISPLAY-ONLY anchors here, even
 *  though eligible (non-US) users can trade them elsewhere. Crypto/RWA with real Uniswap liquidity is LIVE-UNISWAP. */
export type Availability = "LIVE-UNISWAP" | "DISPLAY-ONLY";

/** A real-world asset/security thematically tied to a bucket. LIVE-UNISWAP entries are buyable on-chain via
 *  Uniswap/LI.FI; DISPLAY-ONLY entries are the legible analyst anchor that drives the Sentiment Gap (not bought in-app). */
export type Security = {
  ticker: string;
  name: string;
  /** On-chain ERC-20 (Polygon) for LIVE-UNISWAP securities — used to price via Uniswap /quote. */
  token?: `0x${string}`;
  /** Display spot price (equities feed for stocks; Uniswap /quote for on-chain assets). */
  priceUsd?: number;
  /** Published analyst bear/bull band (bear=low, bull=high) — drives the headline security's percentile. */
  analystBand?: { low: number; high: number };
  availability: Availability;
  /** Where the asset trades, e.g. "polygon" (Uniswap) or "solana/CEX" (off-rail, display-only). */
  chain?: string;
  /** Honest one-liner on tradeability, surfaced in the badge tooltip. */
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
