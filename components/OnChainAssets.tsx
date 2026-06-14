"use client";

import type { ReactNode } from "react";
import type { OnChainAsset } from "@/lib/dashboard/graph";

const DISPLAY = "'Inter Tight', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const C = {
  panel: "#14161B",
  border: "#2A2D34",
  white: "#FFFFFF",
  dim: "#AAB1BC",
  faint: "#7A828D",
  faintest: "#5C636D",
  asset: "#E8EBEF",
  up: "#3FBE85",
} as const;

const CHAIN_LABEL: Record<string, string> = {
  polygon: "Polygon",
  ethereum: "Ethereum",
  base: "Base",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  solana: "Solana",
  "solana/CEX": "Solana / CEX",
  bittensor: "Bittensor",
  chiliz: "Chiliz",
  cosmos: "Cosmos",
  "off-rail": "Off-rail",
};
const chainLabel = (c: string) => CHAIN_LABEL[c] ?? c;

const LIQ_LABEL: Record<OnChainAsset["liquidity"], string> = { high: "high liquidity", medium: "med liquidity", low: "low liquidity" };
const LIQ_COLOR: Record<OnChainAsset["liquidity"], string> = { high: C.asset, medium: C.dim, low: C.faint };

const fmt = (n: number) =>
  n > 0 && n < 0.01
    ? n.toLocaleString("en-US", { maximumSignificantDigits: 2 })
    : n.toLocaleString("en-US", { maximumFractionDigits: n >= 1000 ? 0 : 2 });

function Badge({ children, color = C.dim }: { children: ReactNode; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", height: 20, padding: "0 8px", border: `1px solid ${C.border}`, borderRadius: 999, fontFamily: MONO, fontSize: 10, color, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

/** The on-chain asset universe for a theme: buyable Polygon tokens (● buyable) and the curated relevant
 *  tokens on other ecosystems that we can't add to the basket yet (○ coming soon) — each with a chain +
 *  liquidity badge and an honest note on where it trades / why it isn't buyable here. Honest companion to
 *  the off-chain analyst-band graph. */
export function OnChainAssets({ assets, title }: { assets: OnChainAsset[]; title: string }) {
  if (assets.length === 0) return null;
  return (
    <section style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 24px", marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 18, color: C.white }}>
        {title} on-chain assets
      </h2>
      <p style={{ margin: "6px 0 18px", maxWidth: 640, fontSize: 12.5, lineHeight: 1.5, color: C.faint }}>
        Relevant tokenized assets on-chain. <span style={{ color: C.up }}>● buyable</span> = addable to the basket now on Polygon-Uniswap;
        {" "}<span style={{ color: C.dim }}>○ coming soon</span> = real on-chain assets on other ecosystems we plan to integrate but can&apos;t add yet — each tagged with where it trades and its market depth.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {assets.map((a) => (
          <div key={`${a.chain}:${a.ticker}`} style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 52, padding: "9px 8px", borderRadius: 8, background: a.buyable ? "rgba(63,190,133,0.05)" : "transparent" }}>
            {/* ticker + name */}
            <div style={{ width: 140, display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 13, color: a.buyable ? C.white : C.dim }}>{a.ticker}</span>
              <span style={{ fontSize: 10.5, color: C.faintest, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
            </div>

            {/* status + chain + liquidity */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: a.buyable ? C.up : C.faint, width: 92 }}>
                {a.buyable ? "● buyable" : "○ coming soon"}
              </span>
              <Badge>{chainLabel(a.chain)}</Badge>
              <Badge color={LIQ_COLOR[a.liquidity]}>{LIQ_LABEL[a.liquidity]}</Badge>
            </div>

            {/* note: where it trades / why not buyable here */}
            <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, lineHeight: 1.4, color: C.faint }}>{a.note}</span>

            {/* price (live where available) */}
            <div style={{ width: 88, textAlign: "right", flexShrink: 0 }}>
              {a.priceUsd != null ? (
                <span style={{ fontFamily: MONO, fontSize: 13, color: C.asset, fontFeatureSettings: "'tnum' 1" }}>${fmt(a.priceUsd)}</span>
              ) : (
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.faintest }}>—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
