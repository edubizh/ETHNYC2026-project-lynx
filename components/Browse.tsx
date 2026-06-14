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
        borderRadius: 7,
        background: up ? UP_BG : DOWN_BG,
        border: "1px solid rgba(255,255,255,0.07)",
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        padding: "13px 15px",
      }}
    >
      <Spark up={up} height="46%" />
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        <span style={{ width: 18, height: 18, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 5, background: "rgba(255,255,255,0.16)", fontFamily: MONO, fontSize: 8, color: "#fff" }}>
          {tileCode(slug)}
        </span>
        <span style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 16.5, color: "#fff", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {title}
        </span>
      </div>
      <div style={{ position: "relative", zIndex: 2, marginTop: 4 }}>
        <span style={{ fontFamily: MONO, fontSize: 20, color: "#fff", fontFeatureSettings: "'tnum' 1", lineHeight: 1 }}>{ms.mindshare.toFixed(1)}%</span>
      </div>
      <IdxLine idx={ms.idx} change={ms.change} size={10.5} />
    </Link>
  );
}

/** The locked treemap: AI flagship on the left, the rest sized by mindshare on the right, + Others. */
function Treemap({ ranked, others }: { ranked: RankedTheme[]; others: { mindshare: number; sectors: number } }) {
  const flagship = ranked[0];
  const rest = ranked.slice(1);
  const fa = flagship.ms;
  const faUp = fa.change >= 0;

  return (
    <div style={{ display: "flex", gap: 8, height: 560 }}>
      {/* flagship */}
      <Link
        href={`/theme/${flagship.slug}`}
        style={{ position: "relative", overflow: "hidden", flex: 34, minWidth: 0, borderRadius: 7, background: faUp ? UP_BG : DOWN_BG, border: "1px solid rgba(255,255,255,0.07)", textDecoration: "none", display: "flex", flexDirection: "column", padding: "20px 22px" }}
      >
        <Spark up={faUp} height="64%" />
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <span style={{ width: 24, height: 24, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 5, background: "rgba(255,255,255,0.16)", fontFamily: MONO, fontSize: 10, color: "#fff" }}>
            {tileCode(flagship.slug)}
          </span>
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 32, color: "#fff", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {flagship.title}
          </span>
        </div>
        <div style={{ position: "relative", zIndex: 2, marginTop: 10, display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 36, color: "#fff", fontFeatureSettings: "'tnum' 1", lineHeight: 1 }}>{fa.mindshare.toFixed(1)}%</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.72)" }}>mindshare</span>
        </div>
        <IdxLine idx={fa.idx} change={fa.change} size={12.5} />
        <div style={{ position: "relative", zIndex: 2, marginTop: "auto", fontFamily: DISPLAY, fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.9)" }}>Open dashboard →</div>
      </Link>

      {/* right column */}
      <div style={{ flex: 62, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <div style={{ flex: 30, display: "flex", gap: 8, minHeight: 0 }}>
          {rest.slice(0, 2).map((r) => (
            <div key={r.slug} style={{ flex: r.ms.mindshare, minWidth: 0, display: "flex" }}>
              <Tile slug={r.slug} title={r.title} ms={r.ms} />
            </div>
          ))}
        </div>
        <div style={{ flex: 24, display: "flex", gap: 8, minHeight: 0 }}>
          {rest.slice(2, 4).map((r) => (
            <div key={r.slug} style={{ flex: r.ms.mindshare, minWidth: 0, display: "flex" }}>
              <Tile slug={r.slug} title={r.title} ms={r.ms} />
            </div>
          ))}
        </div>
        <div style={{ flex: 16, display: "flex", gap: 8, minHeight: 0 }}>
          {rest.slice(4).map((r) => (
            <div key={r.slug} style={{ flex: r.ms.mindshare, minWidth: 0, display: "flex" }}>
              <Tile slug={r.slug} title={r.title} ms={r.ms} />
            </div>
          ))}
          {/* Others — aspirational / coming-soon sectors (non-clickable) */}
          <div style={{ position: "relative", overflow: "hidden", flex: others.mindshare, minWidth: 0, borderRadius: 7, background: "#101218", border: "1px solid #20242A", display: "flex", flexDirection: "column", padding: "11px 12px" }}>
            <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
              <span style={{ width: 16, height: 16, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 5, background: "rgba(255,255,255,0.16)", fontFamily: MONO, fontSize: 8, color: "#fff" }}>+</span>
              <span style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 13.5, color: "#fff", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Others</span>
            </div>
            <div style={{ position: "relative", zIndex: 2, marginTop: 4 }}>
              <span style={{ fontFamily: MONO, fontSize: 15, color: "#fff", fontFeatureSettings: "'tnum' 1", lineHeight: 1 }}>{others.mindshare.toFixed(1)}%</span>
            </div>
            <div style={{ position: "relative", zIndex: 2, marginTop: 4, fontFamily: MONO, fontSize: 11, color: "#7A828D" }}>+{others.sectors} sectors</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Filtered search results — uniform tiles in a responsive grid (keeps the locked treemap for browse). */
function ResultsGrid({ tiles }: { tiles: RankedTheme[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 8, gridAutoRows: 150 }}>
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

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "30px 28px 60px" }}>
        {/* header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 11 }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", color: "#FFFFFF" }}>Sector mindshare</span>
            <span style={{ fontSize: 12.5, color: "#7A828D" }}>activity-weighted across belief markets + tokenized securities</span>
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
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 11, color: "#7A828D" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: "#E8EBEF" }} />
                index up
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: "#8A95A6" }} />
                down
              </span>
            </span>
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
          <Treemap ranked={view.ranked} others={view.others} />
        )}

        <p style={{ margin: "16px 2px 0", fontFamily: MONO, fontSize: 11.5, color: "#5C636D" }}>
          Index = tokenized securities price × prediction-basket odds · tile size = share of {WINDOW_NOUN[win]} Polymarket volume
          {fallback ? " · seed data (live feed unavailable)" : ""}
        </p>
      </main>
    </div>
  );
}
