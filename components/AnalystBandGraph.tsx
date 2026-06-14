"use client";

import { useState } from "react";
import type { GraphAsset } from "@/lib/dashboard/graph";

const DISPLAY = "'Inter Tight', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const C = {
  panel: "#14161B",
  border: "#2A2D34",
  track: "#1B1E24",
  soft: "#20242A",
  white: "#FFFFFF",
  dim: "#AAB1BC",
  steel: "#8A95A6",
  faint: "#7A828D",
  faintest: "#5C636D",
  asset: "#E8EBEF",
  up: "#3FBE85",
  down: "#D08A86",
} as const;

const clampPct = (n: number) => Math.min(100, Math.max(0, n));
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: n >= 1000 ? 0 : 2 });

/** Belief range as on-track percentages: lo ≤ c ≤ hi, each 0–100. */
type BeliefBand = { lo: number; c: number; hi: number };

/** A monochrome diamond marker (filled = buyable on-chain, hollow = off-rail "coming soon"). */
function Diamond({ filled, size = 12 }: { filled: boolean; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        transform: "rotate(45deg)",
        borderRadius: 2,
        background: filled ? "linear-gradient(135deg,#F2F4F6,#ADB3BC)" : "transparent",
        border: filled ? "2px solid #0A0B0E" : `1.5px solid ${C.faint}`,
        boxShadow: filled ? "0 0 0 1px #E8EBEF" : "none",
        display: "inline-block",
      }}
    />
  );
}

function Toggle({ view, setView }: { view: "bands" | "scatter"; setView: (v: "bands" | "scatter") => void }) {
  const Btn = ({ id, label }: { id: "bands" | "scatter"; label: string }) => {
    const active = view === id;
    return (
      <button
        onClick={() => setView(id)}
        style={{
          appearance: "none",
          cursor: "pointer",
          height: 28,
          padding: "0 14px",
          border: "none",
          borderRadius: 7,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.01em",
          color: active ? "#0A0B0E" : C.dim,
          background: active ? "linear-gradient(180deg,#F4F6F8,#C4C9D1)" : "transparent",
          transition: "color .15s",
        }}
      >
        {label}
      </button>
    );
  };
  return (
    <div style={{ display: "inline-flex", gap: 2, padding: 3, background: C.track, border: `1px solid ${C.border}`, borderRadius: 9 }}>
      <Btn id="bands" label="Bands" />
      <Btn id="scatter" label="Scatter" />
    </div>
  );
}

/** Bands view: one row per security — its bear→bull band as a 0–100% percentile track, a ◆ at the
 *  security's position, and the crowd belief drawn as a vertical line across every row (the gap reads
 *  against every name at once). */
function BandsView({ assets, belief, headlineTicker }: { assets: GraphAsset[]; belief: BeliefBand; headlineTicker?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* axis header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 0 8px" }}>
        <div style={{ width: 78 }} />
        <div style={{ flex: 1, position: "relative", height: 14 }}>
          <span style={{ position: "absolute", left: 0, top: 0, fontFamily: MONO, fontSize: 9.5, color: C.faintest }}>bear</span>
          <span style={{ position: "absolute", right: 0, top: 0, fontFamily: MONO, fontSize: 9.5, color: C.faintest }}>bull</span>
          <span style={{ position: "absolute", left: `${belief.c}%`, top: 0, transform: "translateX(-50%)", fontFamily: MONO, fontSize: 9.5, color: C.steel, whiteSpace: "nowrap" }}>belief {Math.round(belief.c)}%</span>
        </div>
        <div style={{ width: 132 }} />
      </div>

      {assets.map((a) => {
        const isHead = a.ticker === headlineTicker;
        // True percentile drives the label; the marker position is nudged a few % off the rails so a
        // legitimate 0th/100th (price below/above every analyst target) reads as a real edge, not a clip.
        const markerX = Math.min(96, Math.max(4, a.pct * 100));
        return (
          <div
            key={a.ticker}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              height: 40,
              padding: "0 8px",
              borderRadius: 8,
              background: isHead ? "rgba(232,235,239,0.05)" : "transparent",
            }}
          >
            {/* ticker + availability */}
            <div style={{ width: 78, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 13, color: isHead ? C.white : C.dim, fontWeight: isHead ? 600 : 400 }}>
                {a.ticker}
                {isHead && <span style={{ fontFamily: MONO, fontSize: 8, color: C.faintest }}>★</span>}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 8.5, color: a.comingSoon ? C.faint : C.up, letterSpacing: "0.02em" }}>
                {a.comingSoon ? "○ coming soon" : "● buyable"}
              </span>
            </div>

            {/* band track */}
            <div style={{ flex: 1, position: "relative", height: 10 }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 1, height: 8, background: C.track, border: `1px solid ${C.border}`, borderRadius: 999 }} />
              {/* belief RANGE band + center */}
              <div style={{ position: "absolute", left: `${belief.lo}%`, width: `${Math.max(belief.hi - belief.lo, 0.5)}%`, top: -4, bottom: -4, background: "rgba(138,149,166,0.22)", borderLeft: `1px solid ${C.steel}`, borderRight: `1px solid ${C.steel}` }} />
              <div style={{ position: "absolute", left: `${belief.c}%`, top: -4, bottom: -4, width: 1.5, transform: "translateX(-50%)", background: C.steel, opacity: 0.7 }} />
              {/* asset marker (filled = buyable on-chain, hollow = off-rail "coming soon") */}
              <div style={{ position: "absolute", left: `${markerX}%`, top: -1, transform: "translateX(-50%)", display: "flex" }}>
                <Diamond filled={!a.comingSoon} size={11} />
              </div>
            </div>

            {/* price + band + percentile */}
            <div style={{ width: 132, textAlign: "right", display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: MONO, fontSize: 13, color: C.white, fontFeatureSettings: "'tnum' 1" }}>${fmt(a.priceUsd)}</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint, fontFeatureSettings: "'tnum' 1" }}>
                ${fmt(a.low)}–${fmt(a.high)} · <span style={{ color: C.asset }}>{Math.round(a.pct * 100)}th</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Scatter view: x = band percentile (bear→bull), y = day momentum (%). Each security is a ◆; the
 *  crowd belief is a vertical line. Distance left/right of belief = the sentiment gap for that name. */
function ScatterView({ assets, belief, headlineTicker }: { assets: GraphAsset[]; belief: BeliefBand; headlineTicker?: string }) {
  const H = 300;
  const padX = 30; // room for y labels
  const padY = 22; // room for x labels
  const maxAbs = Math.max(2, ...assets.map((a) => Math.abs(a.changePct)));
  const yMax = Math.ceil(maxAbs);
  const yToTop = (chg: number) => {
    const frac = (yMax - chg) / (2 * yMax); // +yMax -> 0, -yMax -> 1
    return padY + frac * (H - 2 * padY);
  };
  const zeroTop = yToTop(0);

  return (
    <div style={{ position: "relative", height: H, marginTop: 4 }}>
      {/* plot frame */}
      <div style={{ position: "absolute", left: padX, right: 0, top: 0, bottom: padY, border: `1px solid ${C.soft}`, borderRadius: 6, background: "rgba(27,30,36,0.35)" }} />

      {/* y axis labels */}
      <span style={{ position: "absolute", left: 0, top: padY - 6, fontFamily: MONO, fontSize: 9.5, color: C.faintest }}>+{yMax}%</span>
      <span style={{ position: "absolute", left: 0, top: zeroTop - 6, fontFamily: MONO, fontSize: 9.5, color: C.faintest }}>0%</span>
      <span style={{ position: "absolute", left: 0, top: H - padY - 6, fontFamily: MONO, fontSize: 9.5, color: C.faintest }}>−{yMax}%</span>

      {/* plot region */}
      <div style={{ position: "absolute", left: padX, right: 0, top: 0, bottom: padY }}>
        {/* zero momentum line */}
        <div style={{ position: "absolute", left: 0, right: 0, top: zeroTop, height: 1, background: C.soft }} />
        {/* belief RANGE band + center */}
        <div style={{ position: "absolute", left: `${belief.lo}%`, width: `${Math.max(belief.hi - belief.lo, 0.5)}%`, top: 0, bottom: 0, background: "rgba(138,149,166,0.16)", borderLeft: `1px solid ${C.steel}`, borderRight: `1px solid ${C.steel}` }} />
        <div style={{ position: "absolute", left: `${belief.c}%`, top: 0, bottom: 0, width: 1.5, transform: "translateX(-50%)", background: C.steel, opacity: 0.7 }} />
        <span style={{ position: "absolute", left: `${belief.c}%`, top: 2, transform: "translateX(-50%)", fontFamily: MONO, fontSize: 9.5, color: C.steel, whiteSpace: "nowrap" }}>belief {Math.round(belief.c)}%</span>

        {assets.map((a) => {
          const isHead = a.ticker === headlineTicker;
          const left = Math.min(96, Math.max(4, a.pct * 100)); // nudge legit 0th/100th off the frame edge
          const top = yToTop(a.changePct);
          return (
            <div key={a.ticker} style={{ position: "absolute", left: `${left}%`, top, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <Diamond filled={!a.comingSoon} size={11} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: isHead ? C.white : C.dim, fontWeight: isHead ? 600 : 400, whiteSpace: "nowrap" }}>{a.ticker}</span>
            </div>
          );
        })}
      </div>

      {/* x axis labels */}
      <span style={{ position: "absolute", left: padX, bottom: 0, fontFamily: MONO, fontSize: 9.5, color: C.faintest }}>bear · 0%</span>
      <span style={{ position: "absolute", right: 0, bottom: 0, fontFamily: MONO, fontSize: 9.5, color: C.faintest }}>bull · 100%</span>
      <span style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", fontFamily: MONO, fontSize: 9.5, color: C.faintest }}>band percentile →</span>
    </div>
  );
}

/** The traditional-finance intelligence chart: the bucket's relevant off-chain securities plotted
 *  against their published analyst bands, with the crowd-belief overlay. Two toggleable views. */
export function AnalystBandGraph({
  assets,
  belief,
  beliefLabel,
  headlineTicker,
  title,
}: {
  assets: GraphAsset[];
  belief: { low: number; center: number; high: number };
  beliefLabel?: string;
  headlineTicker?: string;
  title: string;
}) {
  const [view, setView] = useState<"bands" | "scatter">("bands");
  if (assets.length === 0) return null;
  const bb: BeliefBand = { lo: clampPct(belief.low * 100), c: clampPct(belief.center * 100), hi: clampPct(belief.high * 100) };

  return (
    <section style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 24px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 18, color: C.white }}>
          {title} securities · analyst bands
        </h2>
        <Toggle view={view} setView={setView} />
      </div>
      <p style={{ margin: "0 0 18px", maxWidth: 640, fontSize: 12.5, lineHeight: 1.5, color: C.faint }}>
        Relevant off-chain securities plotted against their published analyst bear→bull bands.
        {beliefLabel ? (
          <> The <span style={{ color: C.steel }}>belief band</span> is the crowd&apos;s odds across {beliefLabel}, centered at <span style={{ color: C.steel, fontFamily: MONO }}>{Math.round(bb.c)}%</span> — distance from it to each ◆ is the sentiment gap.</>
        ) : (
          <> The <span style={{ color: C.steel }}>belief band</span> is the crowd&apos;s odds; distance to each ◆ is the sentiment gap.</>
        )}
        {" "}Tokenized stocks are off our EVM rails — display-only, buying coming soon.
      </p>

      {view === "bands" ? (
        <BandsView assets={assets} belief={bb} headlineTicker={headlineTicker} />
      ) : (
        <ScatterView assets={assets} belief={bb} headlineTicker={headlineTicker} />
      )}
    </section>
  );
}
