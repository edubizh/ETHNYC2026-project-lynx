"use client";

import { useState } from "react";
import { EnterSheet } from "@/components/EnterSheet";

const DISPLAY = "'Inter Tight', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const CTA = "linear-gradient(180deg,#F4F6F8,#C4C9D1)";

// Monochrome allocation segment shades (belief → asset), per the design.
const SEG = ["#8A95A6", "#A6B2C2", "#C4C9D1", "#E8EBEF"];

export type BuyLeg = { label: string; kind: "prediction" | "asset"; weight: number };

export function BuyBox({ slug, title, legs }: { slug: string; title: string; legs: BuyLeg[] }) {
  const [amountStr, setAmountStr] = useState("250");
  const [open, setOpen] = useState(false);

  const amount = Math.max(0, Number(amountStr.replace(/[^0-9.]/g, "")) || 0);
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const split = legs.map((l, i) => ({ ...l, color: SEG[i % SEG.length], usd: amount * l.weight }));

  return (
    <>
      <section style={{ background: "#14161B", border: "1px solid rgba(232,235,239,0.28)", borderRadius: 10, padding: "22px 24px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 28, alignItems: "stretch", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <span style={{ display: "block", fontSize: 11, color: "#7A828D", marginBottom: 8 }}>Amount to enter</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, height: 48, padding: "0 14px", background: "#1B1E24", border: "1px solid #2A2D34", borderRadius: 9 }}>
                <span style={{ fontFamily: MONO, fontSize: 13, color: "#7A828D" }}>USDC</span>
                <input
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  inputMode="decimal"
                  style={{ flex: 1, minWidth: 0, textAlign: "right", background: "transparent", border: 0, outline: "none", color: "#FFFFFF", fontFamily: MONO, fontSize: 19, fontFeatureSettings: "'tnum' 1" }}
                />
              </div>
              {["100", "250", "500"].map((v) => (
                <button key={v} onClick={() => setAmountStr(v)} style={{ height: 48, padding: "0 12px", background: "transparent", border: "1px solid #2A2D34", borderRadius: 8, fontFamily: MONO, fontSize: 12, color: "#AAB1BC", cursor: "pointer" }}>
                  {v}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", border: "1px solid #2A2D34" }}>
                {split.map((s, i) => (
                  <div key={i} style={{ width: `${s.weight * 100}%`, background: s.color }} />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 13, fontFamily: MONO, fontSize: 11.5, fontFeatureSettings: "'tnum' 1" }}>
                {split.map((s, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#AAB1BC" }}>
                    <span style={{ width: 8, height: 8, borderRadius: s.kind === "asset" ? 1 : "50%", background: s.color, transform: s.kind === "asset" ? "rotate(45deg)" : undefined }} />
                    {shortLabel(s.label)} {Math.round(s.weight * 100)}% <span style={{ color: "#7A828D" }}>·</span> <span style={{ color: "#FFFFFF" }}>${fmt(s.usd)}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ width: 1, background: "#2A2D34" }} />

          <div style={{ width: 236, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#AAB1BC", whiteSpace: "nowrap" }}>You pay</span>
              <span style={{ fontFamily: MONO, fontSize: 20, color: "#FFFFFF", fontFeatureSettings: "'tnum' 1" }}>${fmt(amount)}</span>
            </div>
            <button
              onClick={() => setOpen(true)}
              disabled={amount <= 0}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, height: 48, background: CTA, border: 0, borderRadius: 8, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.01em", fontSize: 15, color: "#0A0B0E", cursor: amount <= 0 ? "not-allowed" : "pointer", opacity: amount <= 0 ? 0.5 : 1 }}
            >
              <span style={{ fontSize: 11 }}>◆</span>Enter basket · one signature
            </button>
            <span style={{ fontSize: 11, lineHeight: 1.5, color: "#7A828D", textAlign: "center" }}>Non-custodial · neutral YES+NO set, delivered to your wallet.</span>
          </div>
        </div>
      </section>

      <EnterSheet open={open} onClose={() => setOpen(false)} slug={slug} title={title} amount={amount} legs={legs} />
    </>
  );
}

/** Trim a leg label to a short token for the allocation legend (e.g. "OpenAI does NOT IPO…" → "OpenAI"). */
function shortLabel(label: string): string {
  const first = label.split(/[\s·(]/)[0];
  return first.length >= 3 ? first : label.slice(0, 8);
}
