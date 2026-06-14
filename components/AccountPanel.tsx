"use client";

import { useArc } from "@/lib/arc/context";

const DISPLAY = "'Inter Tight', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const CTA = "linear-gradient(180deg,#F4F6F8,#C4C9D1)";

export function AccountPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connected, address, usdc, status, connect, sendGaslessUserOp, opStatus, opTxHash } = useArc();
  if (!open) return null;
  const fmt = (n?: number) => (n == null ? "0.00" : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
  const busy = opStatus.endsWith("…"); // progress messages end with an ellipsis

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(5,6,9,0.55)", backdropFilter: "blur(2px)", animation: "lynxFade .2s ease" }} />
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          zIndex: 41,
          width: 380,
          maxWidth: "90vw",
          height: "100%",
          background: "#14161B",
          borderLeft: "1px solid #2A2D34",
          boxShadow: "-24px 0 60px rgba(0,0,0,0.5)",
          padding: 24,
          overflowY: "auto",
          animation: "lynxSlide .24s cubic-bezier(.2,.7,.3,1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 19, color: "#FFFFFF" }}>Account · Arc</h2>
          <button onClick={onClose} style={{ width: 30, height: 30, display: "grid", placeItems: "center", background: "transparent", border: "1px solid #2A2D34", borderRadius: 7, color: "#AAB1BC", cursor: "pointer" }}>✕</button>
        </div>

        {!connected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
            <button onClick={() => connect("register")} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, height: 44, background: CTA, border: 0, borderRadius: 8, fontFamily: DISPLAY, fontWeight: 700, fontSize: 14, color: "#0A0B0E", cursor: "pointer" }}>
              Create passkey wallet
            </button>
            <button onClick={() => connect("login")} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 42, background: "transparent", border: "1px solid #2A2D34", borderRadius: 8, fontSize: 13.5, color: "#FFFFFF", cursor: "pointer" }}>
              Sign in with passkey
            </button>
            <p style={{ margin: "4px 2px 0", fontSize: 12, lineHeight: 1.5, color: "#7A828D" }}>A passkey smart account on Arc. No seed phrase — keys never leave your device.</p>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", background: "rgba(63,190,133,0.07)", border: "1px solid rgba(63,190,133,0.25)", borderRadius: 9, marginBottom: 18, animation: "lynxFade .25s ease" }}>
            <span style={{ color: "#3FBE85" }}>●</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 13, color: "#FFFFFF" }}>Passkey wallet active</span>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#AAB1BC" }}>{short}</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 16px", background: "#1B1E24", border: "1px solid #2A2D34", borderRadius: 9 }}>
            <span style={{ fontSize: 12.5, color: "#AAB1BC" }}>USDC on Arc</span>
            <span style={{ fontFamily: MONO, fontSize: 16, color: "#FFFFFF", fontFeatureSettings: "'tnum' 1" }}>{connected ? fmt(usdc) : "—"}</span>
          </div>
          <div style={{ padding: "15px 16px", background: "#1B1E24", border: "1px solid #2A2D34", borderRadius: 9 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12.5, color: "#AAB1BC" }}>Unified NAV</span>
              <span style={{ fontFamily: MONO, fontSize: 16, color: "#FFFFFF", fontFeatureSettings: "'tnum' 1" }}>${connected ? fmt(usdc) : "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid #2A2D34", fontFamily: MONO, fontSize: 12 }}>
              <span style={{ color: "#7A828D" }}>Arc · USDC</span>
              <span style={{ color: "#AAB1BC" }}>${fmt(usdc)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontFamily: MONO, fontSize: 12 }}>
              <span style={{ color: "#7A828D" }}>Polygon · positions</span>
              <span style={{ color: "#AAB1BC" }}>after you enter a basket</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 16px", border: "1px dashed #2A2D34", borderRadius: 9 }}>
            <span style={{ color: "#E8EBEF", fontSize: 11 }}>◆</span>
            <span style={{ fontSize: 12.5, color: "#AAB1BC" }}>Gas paid in <span style={{ fontFamily: MONO, color: "#FFFFFF" }}>USDC</span> — no native token needed.</span>
          </div>

          {connected && (
            <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "15px 16px", background: "#1B1E24", border: "1px solid #2A2D34", borderRadius: 9 }}>
              <span style={{ fontSize: 11, color: "#7A828D" }}>Arc · USDC-gas userOp (paymaster)</span>
              <button
                onClick={() => sendGaslessUserOp()}
                disabled={busy}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 42, background: busy ? "#1B1E24" : CTA, border: busy ? "1px solid #2A2D34" : 0, borderRadius: 8, fontFamily: DISPLAY, fontWeight: 700, fontSize: 13.5, color: busy ? "#AAB1BC" : "#0A0B0E", cursor: busy ? "default" : "pointer" }}
              >
                <span style={{ fontSize: 11 }}>◆</span>{busy ? "Sending…" : "Send USDC-gas test op"}
              </button>
              {opTxHash && (
                <a href={`https://testnet.arcscan.app/tx/${opTxHash}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", padding: "9px 12px", background: "#0E1014", border: "1px solid #20242A", borderRadius: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#3FBE85" }}>✓ {opTxHash.slice(0, 8)}…{opTxHash.slice(-4)}</span>
                  <span style={{ fontSize: 11, color: "#8A95A6" }}>ArcScan ↗</span>
                </a>
              )}
              {opStatus && <span style={{ fontFamily: MONO, fontSize: 11, color: "#7A828D" }}>{opStatus}</span>}
            </div>
          )}
        </div>
        {status && <p style={{ margin: "14px 2px 0", fontFamily: MONO, fontSize: 11, color: "#7A828D" }}>{status}</p>}
      </aside>
    </>
  );
}
