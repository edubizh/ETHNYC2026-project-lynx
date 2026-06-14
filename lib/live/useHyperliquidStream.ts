"use client";
import { useEffect, useRef, useState } from "react";

// Verified live (2026-06-13): wss://api.hyperliquid.xyz/ws, subscribe
//   {method:"subscribe",subscription:{type:"trades",coin:"BTC"}}
// -> {channel:"trades", data:[{coin,side:"B"|"A",px,sz,time,...}]}  (B=buy, A=sell)
// ~6 trades/sec across BTC/ETH/SOL — a genuine firehose, free, no key, browser-direct.
const WS_URL = "wss://api.hyperliquid.xyz/ws";
const FLOW_CAP = 60;

export type HlTrade = { key: number; coin: string; side: "BUY" | "SELL"; px: number; sz: number; ts: number };
export type HlStatus = "connecting" | "live" | "disconnected";
export type HlState = { status: HlStatus; trades: HlTrade[] };

export function useHyperliquidStream(coins: string[]): HlState {
  const key = coins.filter(Boolean).join(",");
  const [state, setState] = useState<HlState>({ status: "connecting", trades: [] });
  const counter = useRef(0);

  useEffect(() => {
    if (!key) return;
    const list = key.split(",");
    let ws: WebSocket | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);
      } catch {
        schedule();
        return;
      }
      ws.onopen = () => {
        setState((s) => ({ ...s, status: "live" }));
        for (const c of list) ws?.send(JSON.stringify({ method: "subscribe", subscription: { type: "trades", coin: c } }));
      };
      ws.onmessage = (e) => {
        let m: { channel?: string; data?: unknown };
        try {
          m = JSON.parse(typeof e.data === "string" ? e.data : "");
        } catch {
          return;
        }
        if (m?.channel !== "trades" || !Array.isArray(m.data)) return;
        const items: HlTrade[] = (m.data as Record<string, unknown>[]).map((t) => ({
          key: ++counter.current,
          coin: String(t.coin),
          side: t.side === "B" ? "BUY" : "SELL",
          px: Number(t.px),
          sz: Number(t.sz),
          ts: Number(t.time) || Date.now(),
        }));
        if (items.length) setState((s) => ({ status: "live", trades: [...items.reverse(), ...s.trades].slice(0, FLOW_CAP) }));
      };
      ws.onerror = () => ws?.close();
      ws.onclose = () => {
        if (!closed) {
          setState((s) => ({ ...s, status: "disconnected" }));
          schedule();
        }
      };
    };

    const schedule = () => {
      if (!closed) retry = setTimeout(connect, 3000);
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
