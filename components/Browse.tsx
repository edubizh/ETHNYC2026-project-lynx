"use client";

import Link from "next/link";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useSearch } from "@/lib/browse/search-context";
import { filterThemes } from "@/lib/browse/search";
import { tileCode, WINDOWS, type Mindshare, type RankedTheme, type Window, type WindowsView } from "@/lib/mindshare";

const DISPLAY = "'Inter Tight', system-ui, sans-serif";
const BODY = "'IBM Plex Sans', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const UP = "0,27 12,25 24,26 36,21 48,23 60,18 72,20 84,15 96,17 108,12 120,10";
const DOWN = "0,10 12,12 24,11 36,15 48,14 60,17 72,16 84,20 96,18 108,22 120,24";
const UP_BG = "linear-gradient(180deg,#222731 0%,#161a20 100%)";
const DOWN_BG = "linear-gradient(180deg,#121419 0%,#0c0e12 100%)";

const PILL_LABEL: Record<Window, string> = { "24h": "24H", "7d": "7D", "30d": "30D", "3m": "3M" };
// What the tile size measures, for the footer copy. 3M uses Gamma's broadest (all-time) window.
const WINDOW_NOUN: Record<Window, string> = { "24h": "24h", "7d": "7-day", "30d": "30-day", "3m": "all-time" };

function Spark({ up, height }: { up: boolean; height: string }) {
  return (
    <svg viewBox="0 0 120 32" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height }}>
      <polyline
        points={up ? UP : DOWN}
        fill="none"
        stroke={up ? "rgba(236,239,243,0.62)" : "rgba(138,149,166,0.5)"}
        strokeWidth={1.3}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IdxLine({ idx, change, size }: { idx: number; change: number; size: number }) {
  const up = change >= 0;
  return (
    <div style={{ position: "relative", zIndex: 2, marginTop: 4, display: "flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: size, color: "rgba(255,255,255,0.8)" }}>
      <span>idx {idx.toFixed(1)}</span>
      <span style={{ color: up ? "#E8EBEF" : "#8A95A6" }}>
        {up ? "▲" : "▼"} {up ? "+" : ""}
        {change.toFixed(1)}
      </span>
    </div>
  );
}

/** A sector tile that fills its layout parent (a treemap flex cell or a search-grid cell). */
function Tile({ slug, title, ms }: { slug: string; title: string; ms: Mindshare }) {
  const up = ms.change >= 0;
  return (
    <Link
      href={`/theme/${slug}`}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        minWidth: 0,
        borderRadius: 8,
        background: up ? UP_BG : DOWN_BG,
        border: "1px solid rgba(255,255,255,0.07)",
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        padding: "16px 18px",
      }}
    >
      <Spark up={up} height="46%" />
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span style={{ width: 21, height: 21, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 5, background: "rgba(255,255,255,0.16)", fontFamily: MONO, fontSize: 9.5, color: "#fff" }}>
          {tileCode(slug)}
        </span>
        <span style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 20, color: "#fff", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {title}
        </span>
      </div>
      <div style={{ position: "relative", zIndex: 2, marginTop: 6 }}>
        <span style={{ fontFamily: MONO, fontSize: 24, color: "#fff", fontFeatureSettings: "'tnum' 1", lineHeight: 1 }}>{ms.mindshare.toFixed(1)}%</span>
      </div>
      <IdxLine idx={ms.idx} change={ms.change} size={12} />
    </Link>
  );
}

/** Pair the non-flagship sectors into rows of two so the right column always fills (no gaps). */
function chunkRows(arr: RankedTheme[], size: number): RankedTheme[][] {
  const rows: RankedTheme[][] = [];
  for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size));
  return rows;
}

/** The treemap: flagship on the left, the rest sized by mindshare on the right. */
function Treemap({ ranked }: { ranked: RankedTheme[] }) {
  const flagship = ranked[0];
  const rest = ranked.slice(1);
  const fa = flagship.ms;
  const faUp = fa.change >= 0;

  return (
    <div style={{ display: "flex", gap: 9, height: 660 }}>
      {/* flagship */}
      <Link
        href={`/theme/${flagship.slug}`}
        style={{ position: "relative", overflow: "hidden", flex: 34, minWidth: 0, borderRadius: 9, background: faUp ? UP_BG : DOWN_BG, border: "1px solid rgba(255,255,255,0.07)", textDecoration: "none", display: "flex", flexDirection: "column", padding: "26px 28px", animation: "landingRise .55s cubic-bezier(.2,.7,.3,1) both" }}
      >
        <Spark up={faUp} height="64%" />
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <span style={{ width: 30, height: 30, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 6, background: "rgba(255,255,255,0.16)", fontFamily: MONO, fontSize: 12, color: "#fff" }}>
            {tileCode(flagship.slug)}
          </span>
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 40, color: "#fff", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {flagship.title}
          </span>
        </div>
        <div style={{ position: "relative", zIndex: 2, marginTop: 12, display: "flex", alignItems: "baseline", gap: 9 }}>
          <span style={{ fontFamily: MONO, fontSize: 46, color: "#fff", fontFeatureSettings: "'tnum' 1", lineHeight: 1 }}>{fa.mindshare.toFixed(1)}%</span>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.72)" }}>mindshare</span>
        </div>
        <IdxLine idx={fa.idx} change={fa.change} size={15} />
        <div style={{ position: "relative", zIndex: 2, marginTop: "auto", fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: "rgba(255,255,255,0.9)" }}>Open dashboard →</div>
      </Link>

      {/* right column — rest paired into equal-height rows; tile width tracks its mindshare, with a
          readable floor so a bucket with ~0 volume in a given window (e.g. 24H) never collapses. */}
      <div style={{ flex: 62, display: "flex", flexDirection: "column", gap: 9, minWidth: 0 }}>
        {chunkRows(rest, 2).map((row, i) => (
          <div key={i} style={{ flex: 1, display: "flex", gap: 9, minHeight: 0 }}>
            {row.map((r, j) => (
              <div
                key={r.slug}
                style={{
                  flex: Math.max(r.ms.mindshare, 6),
                  minWidth: 0,
                  display: "flex",
                  // staggered entrance — flagship is 0, then each tile fades in 70ms after the last
                  animation: "landingRise .55s cubic-bezier(.2,.7,.3,1) both",
                  animationDelay: `${(i * 2 + j + 1) * 70}ms`,
                }}
              >
                <Tile slug={r.slug} title={r.title} ms={r.ms} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Filtered search results — uniform tiles in a responsive grid (keeps the locked treemap for browse). */
function ResultsGrid({ tiles }: { tiles: RankedTheme[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(256px, 1fr))", gap: 9, gridAutoRows: 172 }}>
      {tiles.map((r) => (
        <Tile key={r.slug} slug={r.slug} title={r.title} ms={r.ms} />
      ))}
    </div>
  );
}

export function Browse({ windows }: { windows: WindowsView }) {
  const [win, setWin] = useState<Window>("24h");
  const { query } = useSearch();
  const view = windows[win];
  const searching = query.trim().length > 0;
  const filtered = filterThemes(view.ranked, query);
  const fallback = view.source === "fallback";

  return (
    <div style={{ minHeight: "100vh", background: "#0A0B0E", color: "#FFFFFF", fontFamily: BODY, WebkitFontSmoothing: "antialiased" }}>
      <TopBar />

      <main style={{ maxWidth: 1340, margin: "0 auto", padding: "30px 28px 60px" }}>
        {/* header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 11 }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em", color: "#FFFFFF" }}>Sector mindshare</span>
            <span style={{ fontSize: 13.5, color: "#7A828D" }}>activity-weighted across belief markets + tokenized securities</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", gap: 2, background: "#14161B", border: "1px solid #2A2D34", borderRadius: 8, padding: 3 }}>
              {WINDOWS.map((w) => {
                const active = w === win;
                return (
                  <button
                    key={w}
                    onClick={() => setWin(w)}
                    aria-pressed={active}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 6,
                      border: 0,
                      cursor: "pointer",
                      background: active ? "#1B1E24" : "transparent",
                      color: active ? "#FFFFFF" : "#7A828D",
                      fontFamily: MONO,
                      fontSize: 12,
                    }}
                  >
                    {PILL_LABEL[w]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* treemap (browse) OR filtered results (search) */}
        {searching ? (
          filtered.length === 0 ? (
            <div style={{ display: "grid", placeItems: "center", height: 280, textAlign: "center" }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, color: "#FFFFFF" }}>No themes match “{query.trim()}”</div>
                <div style={{ marginTop: 8, fontSize: 13, color: "#7A828D" }}>Try a theme (AI, crypto) or a ticker (NVDA, WBTC, TLT).</div>
              </div>
            </div>
          ) : (
            <ResultsGrid tiles={filtered} />
          )
        ) : (
          <Treemap ranked={view.ranked} />
        )}

        <p style={{ margin: "16px 2px 0", fontFamily: MONO, fontSize: 11.5, color: "#5C636D" }}>
          Index = tokenized securities price × prediction-basket odds · tile size = share of {WINDOW_NOUN[win]} Polymarket volume
          {fallback ? " · seed data (live feed unavailable)" : ""}
        </p>
      </main>
    </div>
  );
}
