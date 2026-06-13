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
  weight: number;
};
export type AssetLeg = { kind: "asset"; label: string; token: `0x${string}`; weight: number };
export type Leg = PredictionLeg | AssetLeg;
export type Theme = { slug: string; title: string; legs: Leg[] };
