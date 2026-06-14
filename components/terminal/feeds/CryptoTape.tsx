"use client";
import { useTerminalData } from "@/components/terminal/TerminalData";
import { T } from "@/components/terminal/styles";
import { StatusLine, Empty, bodyWrap } from "./parts";

const px = (n: number) => (n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : n.toFixed(2));
const sz = (n: number) => (n >= 1 ? n.toFixed(2) : n.toPrecision(2));

export function CryptoTape() {
  const { crypto } = useTerminalData();
  return (
    <div style={bodyWrap}>
      <StatusLine status={crypto.status} note="crypto tape · hyperliquid" />
      {crypto.trades.length === 0 ? (
        <Empty>waiting for trades…</Empty>
      ) : (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 1 }}>
          {crypto.trades.map((t) => {
            const buy = t.side === "BUY";
            const color = buy ? T.buy : T.sell;
            return (
              <div key={t.key} style={{ display: "grid", gridTemplateColumns: "12px 34px 1fr auto", alignItems: "center", gap: 6, fontFamily: T.mono, fontSize: 10, color: T.dim }}>
                <span style={{ color }}>{buy ? "▲" : "▼"}</span>
                <span style={{ color: T.faint }}>{t.coin}</span>
                <span style={{ color, textAlign: "right" }}>{px(t.px)}</span>
                <span style={{ color: T.faint, textAlign: "right" }}>{sz(t.sz)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
