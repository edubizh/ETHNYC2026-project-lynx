"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useArc } from "@/lib/arc/context";
import { useSearch } from "@/lib/browse/search-context";
import { AccountPanel } from "@/components/AccountPanel";

const DISPLAY = "'Inter Tight', system-ui, sans-serif";
const BODY = "'IBM Plex Sans', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

export function TopBar() {
  const { connected, address } = useArc();
  const { query, setQuery } = useSearch();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";

  // ⌘K / Ctrl+K focuses the theme search from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.14em", fontSize: 16, color: "#FFFFFF", whiteSpace: "nowrap" }}>
            LYNX
          </span>
        </Link>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: 430, height: 38, padding: "0 13px", background: "#14161B", border: "1px solid #2A2D34", borderRadius: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7A828D" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                // Off the browse page (e.g. inside a dashboard), Enter jumps to the browse results —
                // the query persists via SearchProvider, so the treemap filters on arrival.
                if (e.key === "Enter" && query.trim() && pathname !== "/browse") router.push("/browse");
              }}
              placeholder="Search a theme — AI, defense, the Fed…"
              aria-label="Search themes"
              style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: "#FFFFFF", fontSize: 13.5, fontFamily: BODY }}
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                style={{ background: "transparent", border: 0, cursor: "pointer", color: "#7A828D", fontSize: 16, lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            ) : (
              <span
                aria-hidden
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  flexShrink: 0,
                  padding: "2px 6px",
                  borderRadius: 5,
                  border: "1px solid #2A2D34",
                  background: "#1B1E24",
                  fontFamily: MONO,
                  fontSize: 10.5,
                  color: "#7A828D",
                  letterSpacing: "0.04em",
                }}
              >
                ⌘K
              </span>
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
            <span
              className="launch-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 34,
                padding: "0 18px",
                background: "linear-gradient(180deg,#F4F6F8,#C4C9D1)",
                color: "#0A0B0E",
                borderRadius: 8,
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "-0.01em",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0A0B0E", opacity: 0.55 }} />
              Connect
            </span>
          )}
        </div>
      </header>
      <AccountPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
