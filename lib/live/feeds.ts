import type { ComponentType } from "react";
import type { FeedId } from "@/lib/live/terminalConfig";
import { BeliefBook } from "@/components/terminal/feeds/BeliefBook";
import { BeliefTape } from "@/components/terminal/feeds/BeliefTape";
import { BeliefOdds } from "@/components/terminal/feeds/BeliefOdds";
import { OnchainSwaps } from "@/components/terminal/feeds/OnchainSwaps";
import { PriceTicker } from "@/components/terminal/feeds/PriceTicker";
import { EquityTape } from "@/components/terminal/feeds/EquityTape";

export type FeedNeeds = "market" | "assets" | "equity";
export type FeedDescriptor = { id: FeedId; label: string; blurb: string; needs: FeedNeeds; Component: ComponentType };

/** Single source of truth for the picker + slot renderer. Every FeedId must have an entry. */
export const FEED_CATALOG: Record<FeedId, FeedDescriptor> = {
  "belief-book": { id: "belief-book", label: "Order Book", blurb: "Live YES bid/ask depth", needs: "market", Component: BeliefBook },
  "belief-tape": { id: "belief-tape", label: "Order Flow", blurb: "Live YES/NO buy & sell prints", needs: "market", Component: BeliefTape },
  "belief-odds": { id: "belief-odds", label: "Odds", blurb: "Live YES probability + sparkline", needs: "market", Component: BeliefOdds },
  "onchain-swaps": { id: "onchain-swaps", label: "On-chain", blurb: "Polygon basket-token transfers", needs: "assets", Component: OnchainSwaps },
  "price-ticker": { id: "price-ticker", label: "Prices", blurb: "Asset USD prices (Uniswap)", needs: "assets", Component: PriceTicker },
  "equity-tape": { id: "equity-tape", label: "Equity Tape", blurb: "Live stock prints (needs key)", needs: "equity", Component: EquityTape },
};

export const FEED_LIST: FeedDescriptor[] = Object.values(FEED_CATALOG);
