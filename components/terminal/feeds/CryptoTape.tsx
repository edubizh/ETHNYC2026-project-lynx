"use client";
import { useTerminalData } from "@/components/terminal/TerminalData";
import { T } from "@/components/terminal/styles";
import { FeedBody, Row } from "./parts";

const px = (n: number) => (n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : n.toFixed(2));
const sz = (n: number) => (n >= 1 ? n.toFixed(2) : n.toPrecision(2));

export function CryptoTape() {
  const { crypto } = useTerminalData();
  return (
    <FeedBody status={crypto.status} note="crypto tape · hyperliquid" empty={crypto.trades.length === 0} emptyText="waiting for trades…">
      {crypto.trades.map((t, i) => {
        const buy = t.side === "BUY";
        const c = buy ? T.buy : T.sell;
        return (
          <Row key={t.key} cols="12px 34px 1fr auto" fresh={i === 0}>
            <span style={{ color: c, fontSize: 11 }}>{buy ? "▲" : "▼"}</span>
            <span style={{ color: T.faint }}>{t.coin}</span>
            <span style={{ color: c, textAlign: "right" }}>{px(t.px)}</span>
            <span style={{ color: T.faintest, textAlign: "right" }}>{sz(t.sz)}</span>
          </Row>
        );
      })}
    </FeedBody>
  );
}
