"use client";
import { useTerminalData } from "@/components/terminal/TerminalData";
import { T } from "@/components/terminal/styles";
import { StatusLine, Empty, bodyWrap } from "./parts";

const cents = (p: number) => (Number.isFinite(p) ? `${(p * 100).toFixed(0)}` : "—");
const sz = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`);

export function KalshiTape() {
  const { kalshi } = useTerminalData();
  return (
    <div style={bodyWrap}>
      <StatusLine status={kalshi.status} note="kalshi trades" />
      {kalshi.items.length === 0 ? (
        <Empty>waiting for trades…</Empty>
      ) : (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 1 }}>
          {kalshi.items.map((t) => {
            const yes = t.side === "YES";
            const c = yes ? T.buy : T.sell;
            return (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "12px 1fr auto auto", alignItems: "center", gap: 6, fontFamily: T.mono, fontSize: 10, color: T.dim }}>
                <span style={{ color: c }}>{yes ? "▲" : "▼"}</span>
                <span style={{ color: T.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.ticker}</span>
                <span style={{ color: c, textAlign: "right" }}>{cents(t.price)}¢</span>
                <span style={{ color: T.faintest, textAlign: "right", minWidth: 26 }}>{sz(t.count)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
