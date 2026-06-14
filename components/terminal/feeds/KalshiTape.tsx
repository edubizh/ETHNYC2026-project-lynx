"use client";
import { useTerminalData } from "@/components/terminal/TerminalData";
import { T } from "@/components/terminal/styles";
import { FeedBody, Row } from "./parts";

const cents = (p: number) => (Number.isFinite(p) ? `${(p * 100).toFixed(0)}` : "—");
const count = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n)));

export function KalshiTape() {
  const { kalshi } = useTerminalData();
  return (
    <FeedBody status={kalshi.status} note="kalshi trades" empty={kalshi.items.length === 0} emptyText="waiting for trades…">
      {kalshi.items.map((t, i) => {
        const yes = t.side === "YES";
        const c = yes ? T.buy : T.sell;
        return (
          <Row key={t.id} cols="12px 1fr auto auto" fresh={i === 0}>
            <span style={{ color: c, fontSize: 11 }}>{yes ? "▲" : "▼"}</span>
            <span style={{ color: T.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.ticker}</span>
            <span style={{ color: c, textAlign: "right" }}>{cents(t.price)}¢</span>
            <span style={{ color: T.faintest, textAlign: "right", minWidth: 30, paddingLeft: 6 }}>{count(t.count)}</span>
          </Row>
        );
      })}
    </FeedBody>
  );
}
