"use client";
import { useTerminalData } from "@/components/terminal/TerminalData";
import { T } from "@/components/terminal/styles";
import { StatusLine, Empty, bodyWrap } from "./parts";

const cents = (p: number) => `${(p * 100).toFixed(1)}`;

export function BeliefTape() {
  const { ctx, stream } = useTerminalData();
  const label = (assetId: string) => (assetId === ctx.yesId ? "YES" : assetId === ctx.noId ? "NO" : "—");

  return (
    <div style={bodyWrap}>
      <StatusLine status={stream.status} note="belief flow" />
      {stream.flow.length === 0 ? (
        <Empty>waiting for order flow…</Empty>
      ) : (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 1 }}>
          {stream.flow.map((f) => {
            const buy = f.side === "BUY";
            const color = buy ? T.buy : T.sell;
            return (
              <div key={f.key} style={{ display: "grid", gridTemplateColumns: "12px 30px 1fr auto", alignItems: "center", gap: 6, fontFamily: T.mono, fontSize: 10, color: T.dim, opacity: f.trade ? 1 : 0.92 }}>
                <span style={{ color }}>{buy ? "▲" : "▼"}</span>
                <span style={{ color: T.faint }}>{label(f.assetId)}</span>
                <span style={{ color, textAlign: "right" }}>{cents(f.price)}¢</span>
                <span style={{ color: T.faint, textAlign: "right" }}>{Math.round(f.size).toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
