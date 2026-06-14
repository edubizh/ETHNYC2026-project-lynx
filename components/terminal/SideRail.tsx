"use client";
import { FeedSlot } from "./FeedSlot";
import { visibleFeeds, type SideConfig, type SideKey, type TerminalAction } from "@/lib/live/terminalConfig";
import { T } from "./styles";

export function SideRail({
  side,
  config,
  dispatch,
}: {
  side: SideKey;
  config: SideConfig;
  dispatch: (a: TerminalAction) => void;
}) {
  const feeds = visibleFeeds(config);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      {feeds.map((f, i) => (
        <FeedSlot
          key={`${side}-${i}`}
          feedId={f}
          onPick={(feed) => dispatch({ kind: "setFeed", side, pos: i === 0 ? "top" : "bottom", feed })}
        />
      ))}
      <button
        onClick={() => dispatch({ kind: "toggleSplit", side })}
        style={{
          alignSelf: side === "left" ? "flex-start" : "flex-end",
          background: T.panel2,
          border: `1px solid ${T.border}`,
          borderRadius: 6,
          color: T.faint,
          fontFamily: T.mono,
          fontSize: 9,
          letterSpacing: 0.5,
          padding: "3px 7px",
          cursor: "pointer",
        }}
      >
        {config.mode === "split" ? "⊟ merge" : "⊞ split"}
      </button>
    </div>
  );
}
