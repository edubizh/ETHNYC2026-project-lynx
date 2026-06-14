"use client";
import { useEffect, useRef, useState } from "react";

// Verified live (2026-06-13): wss .../ws/market, subscribe {assets_ids:[...],type:"market"} ->
//  `book`        : {asset_id, bids:[{price,size}], asks:[...], last_trade_price}
//  `price_change`: {price_changes:[{asset_id, price, size, side:"BUY"|"SELL", best_bid, best_ask}]}
//  `last_trade_price` (occasional): an executed trade for an asset.
const WS_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market";
const FLOW_CAP = 50;

export type Level = { price: number; size: number };
export type Book = { bids: Level[]; asks: Level[]; lastTradePrice?: number };
export type FlowItem = {
  key: number;
  assetId: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  ts: number;
  trade?: boolean; // true = executed trade, false/undefined = resting order activity
};
export type StreamStatus = "connecting" | "live" | "disconnected";
export type StreamState = {
  status: StreamStatus;
  books: Record<string, Book>;
  lastPrice: Record<string, number>;
  flow: FlowItem[]; // newest first, capped
};

const num = (v: unknown) => Number(v);
const levels = (a: unknown): Level[] =>
  Array.isArray(a) ? a.map((l) => ({ price: num((l as Level).price), size: num((l as Level).size) })) : [];

/** Opens ONE CLOB market WebSocket for the given asset ids and exposes books, last prices and a
 *  rolling order/trade flow. All belief feeds share this single connection. Auto-reconnects. */
export function usePolymarketStream(assetIds: string[]): StreamState {
  const key = assetIds.filter(Boolean).join(",");
  const [state, setState] = useState<StreamState>({ status: "connecting", books: {}, lastPrice: {}, flow: [] });
  const counter = useRef(0);

  useEffect(() => {
    if (!key) return;
    const ids = key.split(",");
    let ws: WebSocket | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const push = (items: FlowItem[]) =>
      setState((s) => ({ ...s, flow: [...items, ...s.flow].slice(0, FLOW_CAP) }));

    const handle = (m: Record<string, unknown>) => {
      const et = (m.event_type as string) || "";
      if (et === "book") {
        const assetId = String(m.asset_id);
        const ltp = m.last_trade_price != null ? num(m.last_trade_price) : undefined;
        setState((s) => ({
          ...s,
          status: "live",
          books: { ...s.books, [assetId]: { bids: levels(m.bids), asks: levels(m.asks), lastTradePrice: ltp } },
          lastPrice: ltp != null && !Number.isNaN(ltp) ? { ...s.lastPrice, [assetId]: ltp } : s.lastPrice,
        }));
      } else if (et === "price_change") {
        const changes = Array.isArray(m.price_changes) ? (m.price_changes as Record<string, unknown>[]) : [];
        const items: FlowItem[] = changes.map((c) => ({
          key: ++counter.current,
          assetId: String(c.asset_id),
          side: c.side === "SELL" ? "SELL" : "BUY",
          price: num(c.price),
          size: num(c.size),
          ts: Date.now(),
        }));
        if (items.length) push(items);
        setState((s) => {
          const lp = { ...s.lastPrice };
          for (const c of changes) {
            const a = String(c.asset_id);
            const mid = (num(c.best_bid) + num(c.best_ask)) / 2;
            if (!Number.isNaN(mid) && mid > 0) lp[a] = mid;
          }
          return { ...s, status: "live", lastPrice: lp };
        });
      } else if (et === "last_trade_price") {
        const a = String(m.asset_id);
        const p = num(m.price);
        push([{ key: ++counter.current, assetId: a, side: m.side === "SELL" ? "SELL" : "BUY", price: p, size: num(m.size), ts: Date.now(), trade: true }]);
        if (!Number.isNaN(p) && p > 0) setState((s) => ({ ...s, lastPrice: { ...s.lastPrice, [a]: p } }));
      }
    };

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);
      } catch {
        scheduleRetry();
        return;
      }
      ws.onopen = () => {
        setState((s) => ({ ...s, status: "live" }));
        ws?.send(JSON.stringify({ assets_ids: ids, type: "market" }));
      };
      ws.onmessage = (e) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(typeof e.data === "string" ? e.data : "");
        } catch {
          return;
        }
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        for (const m of arr) if (m && typeof m === "object") handle(m as Record<string, unknown>);
      };
      ws.onerror = () => ws?.close();
      ws.onclose = () => {
        if (!closed) {
          setState((s) => ({ ...s, status: "disconnected" }));
          scheduleRetry();
        }
      };
    };

    const scheduleRetry = () => {
      if (closed) return;
      retry = setTimeout(connect, 3000);
    };

    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      ws?.close();
    };
  }, [key]);

  return state;
}
