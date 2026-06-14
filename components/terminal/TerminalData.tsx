"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { FeedContext } from "@/lib/live/types";
import { usePolymarketStream, type StreamState } from "@/lib/live/usePolymarketStream";
import { usePoll, type PollState } from "@/lib/live/usePoll";

export type OnchainSwap = { ticker: string; amount: number; hash: string; ts: number };
export type OnchainResp = { swaps: OnchainSwap[] };
export type PriceRow = { ticker: string; usd: number };
export type PriceResp = { prices: PriceRow[] };

export type TerminalData = {
  ctx: FeedContext;
  stream: StreamState;
  onchain: PollState<OnchainResp>;
  price: PollState<PriceResp>;
};

const Ctx = createContext<TerminalData | null>(null);

/** Runs the shared live data layer ONCE for the theme and provides it to every feed slot. */
export function TerminalDataProvider({ ctx, children }: { ctx: FeedContext; children: ReactNode }) {
  const stream = usePolymarketStream([ctx.yesId, ctx.noId]);
  const onchain = usePoll<OnchainResp>(`/api/feeds/onchain?slug=${encodeURIComponent(ctx.slug)}`, 6000);
  const price = usePoll<PriceResp>(`/api/feeds/price?slug=${encodeURIComponent(ctx.slug)}`, 8000);
  return <Ctx.Provider value={{ ctx, stream, onchain, price }}>{children}</Ctx.Provider>;
}

export function useTerminalData(): TerminalData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTerminalData must be used inside <TerminalDataProvider>");
  return v;
}
