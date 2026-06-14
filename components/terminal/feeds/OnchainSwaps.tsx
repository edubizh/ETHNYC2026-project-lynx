"use client";
import { useTerminalData } from "@/components/terminal/TerminalData";
import { T, timeAgo } from "@/components/terminal/styles";
import { StatusLine, Empty, bodyWrap } from "./parts";

const fmt = (n: number) => (n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : n.toPrecision(3));

export function OnchainSwaps() {
  const { onchain } = useTerminalData();
  const swaps = onchain.data?.swaps ?? [];
  const status = onchain.status === "live" ? "live" : onchain.status === "error" ? "disconnected" : "loading";

  return (
    <div style={bodyWrap}>
      <StatusLine status={status} note="on-chain · polygon" />
      {swaps.length === 0 ? (
        <Empty>{onchain.status === "loading" ? "loading transfers…" : "no recent transfers"}</Empty>
      ) : (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 2 }}>
          {swaps.map((s, i) => (
            <div key={`${s.hash}-${i}`} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 6, fontFamily: T.mono, fontSize: 10, color: T.dim }}>
              <span style={{ color: T.asset, width: 46 }}>{s.ticker}</span>
              <span style={{ textAlign: "right" }}>{fmt(s.amount)}</span>
              <span style={{ color: T.faintest, textAlign: "right" }}>{timeAgo(s.ts)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
