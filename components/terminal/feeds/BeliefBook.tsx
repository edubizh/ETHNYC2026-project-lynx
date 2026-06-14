"use client";
import type { CSSProperties } from "react";
import { useTerminalData } from "@/components/terminal/TerminalData";
import { T } from "@/components/terminal/styles";
import { StatusLine, Empty, bodyWrap } from "./parts";
import type { Level } from "@/lib/live/usePolymarketStream";

const ROWS = 6;
const cents = (p: number) => `${(p * 100).toFixed(1)}`;

function Ladder({ levels, side, max }: { levels: Level[]; side: "ask" | "bid"; max: number }) {
  const color = side === "ask" ? T.sell : T.buy;
  return (
    <>
      {levels.map((l, i) => (
        <div key={`${side}-${i}`} style={{ position: "relative", display: "flex", justifyContent: "space-between", fontFamily: T.mono, fontSize: 10, padding: "1px 4px", color: T.dim }}>
          <span style={{ position: "absolute", inset: 0, background: color, opacity: 0.1, width: `${max > 0 ? (l.size / max) * 100 : 0}%`, [side === "ask" ? "right" : "left"]: 0 } as CSSProperties} />
          <span style={{ position: "relative", color }}>{cents(l.price)}¢</span>
          <span style={{ position: "relative" }}>{Math.round(l.size).toLocaleString()}</span>
        </div>
      ))}
    </>
  );
}

export function BeliefBook() {
  const { ctx, stream } = useTerminalData();
  const book = stream.books[ctx.yesId];
  const asks = (book?.asks ?? []).slice().sort((a, b) => a.price - b.price).slice(0, ROWS);
  const bids = (book?.bids ?? []).slice().sort((a, b) => b.price - a.price).slice(0, ROWS);
  const max = Math.max(1, ...asks.map((l) => l.size), ...bids.map((l) => l.size));
  const mid = book?.lastTradePrice ?? (asks[0] && bids[0] ? (asks[0].price + bids[0].price) / 2 : undefined);

  return (
    <div style={bodyWrap}>
      <StatusLine status={stream.status} note={`YES book · ${ctx.equityTicker || "market"}`} />
      {!book ? (
        <Empty>waiting for order book…</Empty>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <Ladder levels={asks.slice().reverse()} side="ask" max={max} />
          <div style={{ textAlign: "center", fontFamily: T.display, fontSize: 13, color: T.text, padding: "3px 0", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, margin: "2px 0" }}>
            {mid != null ? `${cents(mid)}¢` : "—"}
          </div>
          <Ladder levels={bids} side="bid" max={max} />
        </div>
      )}
    </div>
  );
}
