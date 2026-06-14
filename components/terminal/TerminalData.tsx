"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { FeedContext } from "@/lib/live/types";
import { usePolymarketStream, type StreamState } from "@/lib/live/usePolymarketStream";
import { useHyperliquidStream, type HlState } from "@/lib/live/useHyperliquidStream";
import { usePoll, type PollState } from "@/lib/live/usePoll";

export type OnchainSwap = { ticker: string; amount: number; hash: string; ts: number };
export type OnchainResp = { swaps: OnchainSwap[] };

export type TerminalData = {
  ctx: FeedContext;
  stream: StreamState; // Polymarket belief markets (flow + odds)
  crypto: HlState; // Hyperliquid live trades (firehose)
  onchain: PollState<OnchainResp>; // Blockscout basket-token transfers
};

const Ctx = createContext<TerminalData | null>(null);

/** Runs the shared live data layer ONCE for the theme and provides it to every feed slot.
 *  Only consistently-flowing sources are wired here (Polymarket belief flow, Hyperliquid trades,
 *  on-chain transfers) — static/quote feeds were removed so the rails never look dead. */
export function TerminalDataProvider({ ctx, children }: { ctx: FeedContext; children: ReactNode }) {
  const stream = usePolymarketStream([ctx.yesId, ctx.noId]);
  const crypto = useHyperliquidStream(["BTC", "ETH", "SOL"]);
  const onchain = usePoll<OnchainResp>(`/api/feeds/onchain?slug=${encodeURIComponent(ctx.slug)}`, 6000);
  return <Ctx.Provider value={{ ctx, stream, crypto, onchain }}>{children}</Ctx.Provider>;
}

export function useTerminalData(): TerminalData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTerminalData must be used inside <TerminalDataProvider>");
  return v;
}
