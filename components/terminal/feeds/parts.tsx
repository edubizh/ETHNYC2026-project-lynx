"use client";
import type { CSSProperties, ReactNode } from "react";
import { T } from "@/components/terminal/styles";

export type FeedStatus = "live" | "connecting" | "disconnected" | "loading" | "error";

export const bodyWrap: CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 3,
  padding: "8px 11px",
  overflow: "hidden",
};

const tapeList: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: 1,
};

/** Pulsing status dot + uppercase label (live → note; else "status · note"). */
export function StatusLine({ status, note }: { status: FeedStatus; note: string }) {
  const live = status === "live";
  const down = status === "disconnected" || status === "error";
  const dot = live ? T.asset : down ? T.faintest : T.belief;
  const anim = live
    ? "lynxLive 1.6s ease-in-out infinite"
    : status === "connecting" || status === "loading"
      ? "lynxLive 1s ease-in-out infinite"
      : "none";
  const label = live ? note : `${status} · ${note}`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: T.mono, fontSize: 10, color: T.faint, letterSpacing: "0.4px", padding: "1px 1px 5px" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, boxShadow: live ? `0 0 6px ${T.asset}` : "none", animation: anim }} />
      <span style={{ textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 60, color: T.faintest, fontFamily: T.mono, fontSize: 12, textAlign: "center", padding: 10 }}>
      {children}
    </div>
  );
}

/** One tape row: monochrome grid, 13px mono; flashes in (lynxTapeIn) when `fresh` (newest). */
export function Row({ cols, fresh, children }: { cols: string; fresh?: boolean; children: ReactNode }) {
  return (
    <div style={{ position: "relative", display: "grid", gridTemplateColumns: cols, alignItems: "center", gap: 7, fontFamily: T.mono, fontSize: 13, lineHeight: "21px", color: T.dim, borderRadius: 3, animation: fresh ? "lynxTapeIn .5s ease" : undefined }}>
      {children}
    </div>
  );
}

/** Shared feed body: status line + (status-aware empty | tape list). Mirrors the design's `_body`. */
export function FeedBody({ status, note, empty, emptyText, children }: { status: FeedStatus; note: string; empty: boolean; emptyText: string; children: ReactNode }) {
  const text =
    status === "connecting" || status === "loading"
      ? "connecting…"
      : status === "disconnected" || status === "error"
        ? "disconnected — retrying…"
        : emptyText;
  return (
    <div style={bodyWrap}>
      <StatusLine status={status} note={note} />
      {empty ? <Empty>{text}</Empty> : <div style={tapeList}>{children}</div>}
    </div>
  );
}
