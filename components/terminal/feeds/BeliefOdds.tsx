"use client";
import { useRef } from "react";
import { useTerminalData } from "@/components/terminal/TerminalData";
import { T } from "@/components/terminal/styles";
import { StatusLine, Empty, bodyWrap } from "./parts";

const SPARK = 32;

function Spark({ pts }: { pts: number[] }) {
  if (pts.length < 2) return null;
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const span = hi - lo || 1;
  const d = pts
    .map((p, i) => `${(i / (pts.length - 1)) * 100},${28 - ((p - lo) / span) * 26}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" style={{ width: "100%", height: 30 }}>
      <polyline points={d} fill="none" stroke={T.belief} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function BeliefOdds() {
  const { ctx, stream } = useTerminalData();
  const yes = stream.lastPrice[ctx.yesId];
  const hist = useRef<number[]>([]);
  if (yes != null && !Number.isNaN(yes)) {
    const h = hist.current;
    if (h.length === 0 || h[h.length - 1] !== yes) {
      h.push(yes);
      if (h.length > SPARK) h.shift();
    }
  }

  return (
    <div style={bodyWrap}>
      <StatusLine status={stream.status} note="YES odds" />
      {yes == null ? (
        <Empty>waiting for price…</Empty>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <div style={{ fontFamily: T.display, fontSize: 30, lineHeight: 1, color: T.text, textAlign: "center" }}>
            {(yes * 100).toFixed(1)}
            <span style={{ fontSize: 14, color: T.faint }}>%</span>
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, textAlign: "center", letterSpacing: 0.3 }}>
            {ctx.marketLabel}
          </div>
          <Spark pts={hist.current} />
        </div>
      )}
    </div>
  );
}
