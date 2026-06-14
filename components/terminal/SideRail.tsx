"use client";
import { FeedSlot } from "./FeedSlot";
import { visibleFeeds, type SideConfig, type SideKey, type SidePos, type TerminalAction } from "@/lib/live/terminalConfig";
import { T } from "./styles";

/** Dashed placeholder that fills the open slot; click to add a second (or first) feed to this gutter. */
function AddSlot({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      aria-label="Add a feed"
      title="Add a feed"
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: "transparent",
        border: `1px dashed ${T.border}`,
        borderRadius: 9,
        color: T.faint,
        fontFamily: T.display,
        fontWeight: 600,
        fontSize: 13.5,
        letterSpacing: "-0.01em",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 17, lineHeight: 1 }}>+</span> add feed
    </button>
  );
}

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
  const single = config.mode === "single";
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
      {feeds.map((f, i) => {
        const pos: SidePos = i === 0 ? "top" : "bottom";
        return (
          <FeedSlot
            key={`${side}-${i}`}
            feedId={f}
            onPick={(feed) => dispatch({ kind: "setFeed", side, pos, feed })}
            onClose={() => dispatch({ kind: "closeFeed", side, pos })}
            // Single feed fills the whole rail; its header carries the + to add the second.
            onAdd={single ? () => dispatch({ kind: "addFeed", side }) : undefined}
          />
        );
      })}
      {config.mode === "empty" && <AddSlot onAdd={() => dispatch({ kind: "addFeed", side })} />}
    </div>
  );
}
