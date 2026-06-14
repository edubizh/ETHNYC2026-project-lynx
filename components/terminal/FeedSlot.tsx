"use client";
import { FEED_CATALOG, FEED_LIST } from "@/lib/live/feeds";
import type { FeedId } from "@/lib/live/terminalConfig";
import { T } from "./styles";

export function FeedSlot({ feedId, onPick }: { feedId: FeedId; onPick: (f: FeedId) => void }) {
  const d = FEED_CATALOG[feedId];
  const Body = d.Component;
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px 4px 8px", borderBottom: `1px solid ${T.border}`, background: T.panel2 }}>
        <span style={{ fontFamily: T.mono, fontSize: 9, color: T.faintest, letterSpacing: 0.5 }}>▾</span>
        <select
          value={feedId}
          onChange={(e) => onPick(e.target.value as FeedId)}
          title={d.blurb}
          style={{
            flex: 1,
            appearance: "none",
            WebkitAppearance: "none",
            background: "transparent",
            border: "none",
            color: T.text,
            fontFamily: T.display,
            fontSize: 11,
            letterSpacing: 0.3,
            textAlign: "right",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {FEED_LIST.map((f) => (
            <option key={f.id} value={f.id} style={{ background: T.panel, color: T.text }}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <Body />
      </div>
    </div>
  );
}
