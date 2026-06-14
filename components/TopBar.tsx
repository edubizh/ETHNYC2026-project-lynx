"use client";

import { useState } from "react";
import Link from "next/link";
import { useArc } from "@/lib/arc/context";
import { useSearch } from "@/lib/browse/search-context";
import { AccountPanel } from "@/components/AccountPanel";

const DISPLAY = "'Inter Tight', system-ui, sans-serif";
const BODY = "'IBM Plex Sans', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

export function TopBar() {
  const { connected, address } = useArc();
  const { query, setQuery } = useSearch();
  const [open, setOpen] = useState(false);
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: 24,
          height: 60,
          padding: "0 28px",
          background: "rgba(10,11,14,0.82)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid #2A2D34",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", flexShrink: 0 }}>
          <span style={{ position: "relative", width: 22, height: 22, display: "inline-grid", placeItems: "center" }}>
            <span style={{ width: 13, height: 13, background: "linear-gradient(135deg,#F2F4F6,#ADB3BC)", transform: "rotate(45deg)", borderRadius: 2 }} />
            <span style={{ position: "absolute", width: 22, height: 22, border: "1px solid rgba(232,235,239,0.35)", transform: "rotate(45deg)", borderRadius: 4 }} />
          </span>
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 15, color: "#FFFFFF", whiteSpace: "nowrap" }}>
            Traditional Predictions
          </span>
        </Link>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: 430, height: 38, padding: "0 13px", background: "#14161B", border: "1px solid #2A2D34", borderRadius: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7A828D" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a theme — AI, defense, the Fed…"
              aria-label="Search themes"
              style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: "#FFFFFF", fontSize: 13.5, fontFamily: BODY }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                style={{ background: "transparent", border: 0, cursor: "pointer", color: "#7A828D", fontSize: 16, lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div onClick={() => setOpen(true)} style={{ flexShrink: 0, cursor: "pointer" }}>
          {connected ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 34, padding: "0 13px", background: "#14161B", border: "1px solid #2A2D34", borderRadius: 8, fontFamily: MONO, fontSize: 12.5, color: "#AAB1BC" }}>
              <span style={{ color: "#3FBE85" }}>●</span>
              {short}
              <span style={{ color: "#7A828D" }}>· Arc</span>
            </span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", height: 34, padding: "0 15px", border: "1px solid rgba(232,235,239,0.45)", borderRadius: 8, fontFamily: DISPLAY, fontWeight: 600, fontSize: 13, color: "#E8EBEF" }}>
              Connect
            </span>
          )}
        </div>
      </header>
      <AccountPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
