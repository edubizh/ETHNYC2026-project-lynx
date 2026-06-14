"use client";
import { useTerminalData } from "@/components/terminal/TerminalData";
import { T } from "@/components/terminal/styles";
import { StatusLine, Empty, bodyWrap } from "./parts";

// STRETCH: real US-equity trade prints need a valid Finnhub key + a server WS proxy
// (wss://ws.finnhub.io). Until that's wired this renders an honest "needs key" state so the
// demo never depends on it. The slot still works — pick another feed any time.
export function EquityTape() {
  const { ctx } = useTerminalData();
  return (
    <div style={bodyWrap}>
      <StatusLine status="disconnected" note={`equity tape · ${ctx.equityTicker}`} />
      <Empty>
        live {ctx.equityTicker} prints
        <br />
        need a Finnhub key + WS proxy
      </Empty>
    </div>
  );
}
