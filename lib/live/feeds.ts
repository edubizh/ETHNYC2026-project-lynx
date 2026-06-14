import type { ComponentType } from "react";
import type { FeedId } from "@/lib/live/terminalConfig";
import { CryptoTape } from "@/components/terminal/feeds/CryptoTape";
import { BeliefTape } from "@/components/terminal/feeds/BeliefTape";
import { BeliefOdds } from "@/components/terminal/feeds/BeliefOdds";
import { OnchainSwaps } from "@/components/terminal/feeds/OnchainSwaps";

export type FeedNeeds = "market" | "crypto" | "assets";
export type FeedDescriptor = { id: FeedId; label: string; blurb: string; needs: FeedNeeds; Component: ComponentType };

// Only feeds with consistent / semi-consistent real-time flow (measured 2026-06-13): Hyperliquid
// trades ~347/min, belief order-flow ~27/min, on-chain ~23/min, belief odds ~14/min. Static feeds
// (order book ~3/min, Uniswap price polls, keyless equity tape) were removed so the rails feel alive.
export const FEED_CATALOG: Record<FeedId, FeedDescriptor> = {
  "crypto-tape": { id: "crypto-tape", label: "Crypto Tape", blurb: "Live BTC/ETH/SOL trades (Hyperliquid)", needs: "crypto", Component: CryptoTape },
  "belief-tape": { id: "belief-tape", label: "Belief Flow", blurb: "Live YES/NO buy & sell prints", needs: "market", Component: BeliefTape },
  "belief-odds": { id: "belief-odds", label: "Belief Odds", blurb: "Live YES probability + sparkline", needs: "market", Component: BeliefOdds },
  "onchain-swaps": { id: "onchain-swaps", label: "On-chain", blurb: "Polygon basket-token transfers", needs: "assets", Component: OnchainSwaps },
};

export const FEED_LIST: FeedDescriptor[] = Object.values(FEED_CATALOG);
