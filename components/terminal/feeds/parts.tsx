"use client";
import type { CSSProperties, ReactNode } from "react";
import { T } from "@/components/terminal/styles";

/** Tiny shared status dot + label shown in feed bodies. */
export function StatusLine({ status, note }: { status: "live" | "connecting" | "disconnected" | "loading" | "error"; note?: string }) {
  const live = status === "live";
  const color = live ? T.asset : status === "disconnected" || status === "error" ? T.faintest : T.faint;
  const label = note ?? (live ? "live" : status);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: T.mono, fontSize: 9, color: T.faint, letterSpacing: 0.4 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, boxShadow: live ? `0 0 6px ${T.asset}` : "none" }} />
      <span style={{ textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 60, color: T.faintest, fontFamily: T.mono, fontSize: 10, textAlign: "center", padding: 10 }}>
      {children}
    </div>
  );
}

export const bodyWrap: CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "6px 8px",
  overflow: "hidden",
};
