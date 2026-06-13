"use client";

import { useArc } from "@/lib/arc/context";

const MONO = "'IBM Plex Mono', monospace";

/** Arc account / NAV bar on the bucket dashboard. Shares the app-wide passkey account (useArc) with the
 *  top-bar chip and the account slide-over. Unified NAV = Arc USDC + this bucket's on-chain leg value. */
export function ArcAccountBar({ polygonNav }: { polygonNav: number }) {
  const { connected, address, usdc, status, connect } = useArc();
  const arc = usdc ?? 0;
  const nav = arc + polygonNav;
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "stretch", background: "#14161B", border: "1px solid #2A2D34", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, padding: "14px 18px" }}>
          <span style={{ fontSize: 11, color: "#7A828D" }}>Account</span>
          {connected ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, color: "#FFFFFF" }}>
              <span style={{ color: "#3FBE85" }}>●</span>Passkey · Arc <span style={{ fontFamily: MONO, color: "#AAB1BC", fontSize: 12 }}>{short}</span>
            </span>
          ) : (
            <span onClick={() => connect("register")} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, color: "#AAB1BC", cursor: "pointer" }}>
              <span style={{ color: "#7A828D" }}>○</span>No passkey — create one
            </span>
          )}
        </div>
        <div style={{ width: 1, background: "#2A2D34" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, padding: "14px 18px" }}>
          <span style={{ fontSize: 11, color: "#7A828D" }}>USDC on Arc</span>
          <span style={{ fontFamily: MONO, fontSize: 16, fontFeatureSettings: "'tnum' 1", color: "#FFFFFF" }}>{connected ? fmt(arc) : "—"}</span>
        </div>
        <div style={{ width: 1, background: "#2A2D34" }} />
        <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: 5, padding: "14px 18px" }}>
          <span style={{ fontSize: 11, color: "#7A828D" }}>
            Unified NAV <span style={{ color: "#5C636D" }}>· Arc + Polygon</span>
          </span>
          <span style={{ fontFamily: MONO, fontSize: 16, fontFeatureSettings: "'tnum' 1", color: "#FFFFFF" }}>
            {connected ? `$${fmt(nav)}` : `$${fmt(polygonNav)}`}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", padding: "0 18px", borderLeft: "1px solid #2A2D34" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 11, color: "#E8EBEF" }}>
            <span style={{ fontSize: 9 }}>◆</span>Gas paid in USDC
          </span>
        </div>
      </div>
      {status && <p style={{ margin: "8px 2px 0", fontFamily: MONO, fontSize: 11, color: "#7A828D" }}>{status}</p>}
    </div>
  );
}
