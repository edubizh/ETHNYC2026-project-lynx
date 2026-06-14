import type { ComponentType } from "react";
import type { FeedId } from "@/lib/live/terminalConfig";
import { UniswapTape } from "@/components/terminal/feeds/UniswapTape";
import { KalshiTape } from "@/components/terminal/feeds/KalshiTape";
import { BeliefTape } from "@/components/terminal/feeds/BeliefTape";
import { CryptoTape } from "@/components/terminal/feeds/CryptoTape";

export type FeedNeeds = "dex" | "market" | "crypto";
export type FeedDescriptor = { id: FeedId; label: string; blurb: string; needs: FeedNeeds; Component: ComponentType };

// Exactly one consistently-flowing feed per venue (measured 2026-06-14): Uniswap v4 Base swaps
// ~300+/min, Kalshi macro/crypto/politics trades (firehose, filtered), Hyperliquid ~347/min,
// Polymarket belief order-flow ~27/min. Static/quote feeds were removed so the rails never look dead.
export const FEED_CATALOG: Record<FeedId, FeedDescriptor> = {
  uniswap: { id: "uniswap", label: "Uniswap", blurb: "Live Uniswap v4 swaps (Base)", needs: "dex", Component: UniswapTape },
  kalshi: { id: "kalshi", label: "Kalshi", blurb: "Live Kalshi trades (macro/crypto/politics)", needs: "market", Component: KalshiTape },
  polymarket: { id: "polymarket", label: "Polymarket", blurb: "Live belief-market order flow", needs: "market", Component: BeliefTape },
  hyperliquid: { id: "hyperliquid", label: "Hyperliquid", blurb: "Live BTC/ETH/SOL trades", needs: "crypto", Component: CryptoTape },
};

export const FEED_LIST: FeedDescriptor[] = Object.values(FEED_CATALOG);
