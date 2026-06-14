"use client";
import { useTerminalData } from "@/components/terminal/TerminalData";
import { T } from "@/components/terminal/styles";
import { FeedBody, Row } from "./parts";

export function BeliefTape() {
  const { ctx, stream } = useTerminalData();
  const leg = (assetId: string) => (assetId === ctx.yesId ? "YES" : assetId === ctx.noId ? "NO" : "—");
  return (
    <FeedBody status={stream.status} note="belief flow" empty={stream.flow.length === 0} emptyText="waiting for order flow…">
      {stream.flow.map((f, i) => {
        const buy = f.side === "BUY";
        const c = buy ? T.buy : T.sell;
        return (
          <Row key={f.key} cols="12px 30px 1fr auto" fresh={i === 0}>
            <span style={{ color: c, fontSize: 11 }}>{buy ? "▲" : "▼"}</span>
            <span style={{ color: T.faint }}>{leg(f.assetId)}</span>
            <span style={{ color: c, textAlign: "right" }}>{(f.price * 100).toFixed(1)}¢</span>
            <span style={{ color: T.faintest, textAlign: "right" }}>{Math.round(f.size).toLocaleString()}</span>
          </Row>
        );
      })}
    </FeedBody>
  );
}
