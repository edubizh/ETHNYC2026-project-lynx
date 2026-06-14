"use client";
import { useTerminalData } from "@/components/terminal/TerminalData";
import { T } from "@/components/terminal/styles";
import { StatusLine, Empty, bodyWrap } from "./parts";

function sz(n: number, unit: string): string {
  const v = n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n >= 1 ? n.toFixed(1) : n.toPrecision(2);
  return unit === "$" ? `$${v}` : `${v} ${unit}`;
}

export function UniswapTape() {
  const { uniswap } = useTerminalData();
  return (
    <div style={bodyWrap}>
      <StatusLine status={uniswap.status} note="uniswap v4 · base" />
      {uniswap.items.length === 0 ? (
        <Empty>waiting for swaps…</Empty>
      ) : (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 1 }}>
          {uniswap.items.map((s) => {
            const buy = s.side === "BUY";
            const c = buy ? T.buy : T.sell;
            return (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "12px 1fr auto", alignItems: "center", gap: 6, fontFamily: T.mono, fontSize: 10, color: T.dim }}>
                <span style={{ color: c }}>{buy ? "▲" : "▼"}</span>
                <span style={{ color: T.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.pair}</span>
                <span style={{ color: c, textAlign: "right" }}>{sz(s.size, s.unit)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
