"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { FeedContext } from "@/lib/live/types";
import { usePolymarketStream, type StreamState } from "@/lib/live/usePolymarketStream";
import { useHyperliquidStream, type HlState } from "@/lib/live/useHyperliquidStream";
import { useTapePoll, type TapeState } from "@/lib/live/useTapePoll";

export type KalshiItem = { id: string; ticker: string; side: "YES" | "NO"; price: number; count: number; ts: number };
export type UniswapItem = { id: string; pair: string; side: "BUY" | "SELL"; size: number; unit: string; block: number };

export type TerminalData = {
  ctx: FeedContext;
  stream: StreamState; // Polymarket belief-market order flow (WS)
  crypto: HlState; // Hyperliquid trades (WS)
  kalshi: TapeState<KalshiItem>; // Kalshi macro/crypto/politics trades (poll)
  uniswap: TapeState<UniswapItem>; // Uniswap v4 Base swaps (poll)
};

const Ctx = createContext<TerminalData | null>(null);

/** Runs the shared live data layer ONCE for the theme and provides it to every feed slot.
 *  One consistently-flowing feed per venue: Uniswap, Kalshi, Polymarket, Hyperliquid. */
export function TerminalDataProvider({ ctx, children }: { ctx: FeedContext; children: ReactNode }) {
  const stream = usePolymarketStream([ctx.yesId, ctx.noId]);
  const crypto = useHyperliquidStream(["BTC", "ETH", "SOL"]);
  const kalshi = useTapePoll<KalshiItem>("/api/feeds/kalshi", 3000);
  const uniswap = useTapePoll<UniswapItem>("/api/feeds/uniswap", 4000);
  return <Ctx.Provider value={{ ctx, stream, crypto, kalshi, uniswap }}>{children}</Ctx.Provider>;
}

export function useTerminalData(): TerminalData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTerminalData must be used inside <TerminalDataProvider>");
  return v;
}
