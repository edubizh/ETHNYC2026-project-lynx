"use client";
import { useTerminalData } from "@/components/terminal/TerminalData";
import { T } from "@/components/terminal/styles";
import { FeedBody, Row } from "./parts";

function usz(n: number, unit: string): string {
  const v = n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n >= 1 ? n.toFixed(1) : n.toPrecision(2);
  return unit === "$" ? `$${v}` : `${v} ${unit}`;
}

export function UniswapTape() {
  const { uniswap } = useTerminalData();
  return (
    <FeedBody status={uniswap.status} note="uniswap v4 · base" empty={uniswap.items.length === 0} emptyText="waiting for swaps…">
      {uniswap.items.map((s, i) => {
        const buy = s.side === "BUY";
        const c = buy ? T.buy : T.sell;
        return (
          <Row key={s.id} cols="12px 1fr auto" fresh={i === 0}>
            <span style={{ color: c, fontSize: 11 }}>{buy ? "▲" : "▼"}</span>
            <span style={{ color: T.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.pair}</span>
            <span style={{ color: c, textAlign: "right" }}>{usz(s.size, s.unit)}</span>
          </Row>
        );
      })}
    </FeedBody>
  );
}
