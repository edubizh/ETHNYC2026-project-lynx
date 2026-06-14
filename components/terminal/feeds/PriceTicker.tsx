"use client";
import { useRef } from "react";
import { useTerminalData } from "@/components/terminal/TerminalData";
import { T } from "@/components/terminal/styles";
import { StatusLine, Empty, bodyWrap } from "./parts";

const usd = (n: number) => (n >= 100 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : n.toFixed(2));

export function PriceTicker() {
  const { price } = useTerminalData();
  const rows = price.data?.prices ?? [];
  const prev = useRef<Record<string, number>>({});
  const status = price.status === "live" ? "live" : price.status === "error" ? "disconnected" : "loading";

  return (
    <div style={bodyWrap}>
      <StatusLine status={status} note="asset prices · uniswap" />
      {rows.length === 0 ? (
        <Empty>{price.status === "loading" ? "loading quotes…" : "no quotes"}</Empty>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
          {rows.map((r) => {
            const before = prev.current[r.ticker];
            const dir = before == null ? 0 : r.usd > before ? 1 : r.usd < before ? -1 : 0;
            prev.current[r.ticker] = r.usd;
            const color = dir > 0 ? T.buy : dir < 0 ? T.sell : T.dim;
            return (
              <div key={r.ticker} style={{ display: "grid", gridTemplateColumns: "1fr auto 12px", alignItems: "center", gap: 6, fontFamily: T.mono, fontSize: 11 }}>
                <span style={{ color: T.asset }}>{r.ticker}</span>
                <span style={{ color, textAlign: "right" }}>${usd(r.usd)}</span>
                <span style={{ color }}>{dir > 0 ? "▲" : dir < 0 ? "▼" : "·"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
