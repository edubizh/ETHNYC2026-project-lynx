"use client";

import { useState } from "react";
import { useAccount, useConnect, useWalletClient, useSwitchChain } from "wagmi";
import { initLifi, buildEnterQuote, convertQuoteToRoute, executeRoute } from "@/lib/lifi/enter";
import type { BuyLeg } from "@/components/BuyBox";

const DISPLAY = "'Inter Tight', system-ui, sans-serif";
const BODY = "'IBM Plex Sans', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const CTA = "linear-gradient(180deg,#F4F6F8,#C4C9D1)";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ETH = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ENTER_BASKET = process.env.NEXT_PUBLIC_ENTER_BASKET ?? "0x0000000000000000000000000000000000000000";
// Real, recorded standalone Uniswap $7k swap — shown as separate evidence (NOT part of the basket).
const UNISWAP_EVIDENCE = "0x23a05c509b64c36ef38671d19a965f8464ca1c2876848637924972a72327cbde";

type ChipState = "idle" | "pending" | "done";
type Result = "success" | "refund" | null;

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  background: "rgba(5,6,9,0.66)",
  backdropFilter: "blur(3px)",
  animation: "lynxFade .2s ease",
};

function btnGhost(extra?: React.CSSProperties): React.CSSProperties {
  return {
    height: 46,
    padding: "0 18px",
    background: "transparent",
    border: "1px solid #2A2D34",
    borderRadius: 8,
    fontFamily: BODY,
    fontSize: 13.5,
    color: "#AAB1BC",
    cursor: "pointer",
    ...extra,
  };
}
function btnCta(extra?: React.CSSProperties): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    height: 46,
    background: CTA,
    border: 0,
    borderRadius: 8,
    fontFamily: DISPLAY,
    fontWeight: 700,
    fontSize: 14,
    color: "#0A0B0E",
    cursor: "pointer",
    ...extra,
  };
}

export function EnterSheet({
  open,
  onClose,
  slug,
  title,
  amount,
  legs,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  title: string;
  amount: number;
  legs: BuyLeg[];
}) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();

  const [step, setStep] = useState(1);
  const [chips, setChips] = useState<ChipState[]>(["idle", "idle", "idle"]);
  const [signing, setSigning] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [txHash, setTxHash] = useState<string>("");
  const [errMsg, setErrMsg] = useState<string>("");

  if (!open) return null;

  const chainId = walletClient?.chain?.id;
  const onAllowedChain = chainId === 1 || chainId === 8453;
  const recipient = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "your wallet";
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const predCount = legs.filter((l) => l.kind === "prediction").length;

  const labels = ["Connect", "Review", "Sign", "Result"];

  function reset() {
    setStep(1);
    setChips(["idle", "idle", "idle"]);
    setSigning(false);
    setResult(null);
    setTxHash("");
    setErrMsg("");
  }
  function close() {
    reset();
    onClose();
  }

  async function sign() {
    try {
      setSigning(true);
      setChips(["pending", "idle", "idle"]);
      if (!address || !walletClient || !onAllowedChain) throw new Error("Connect on Ethereum or Base first.");
      if (ENTER_BASKET === "0x0000000000000000000000000000000000000000") throw new Error("EnterBasket address not set.");
      const totalUsdce = BigInt(Math.round(amount * 1e6));
      const res = await fetch("/api/basket-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, amount, recipient: address, enterBasket: ENTER_BASKET }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `basket-entry ${res.status}`);
      const contractCalls = body.contractCalls;
      initLifi({ getWalletClient: async () => walletClient, switchChain: async () => walletClient });
      const quote = await buildEnterQuote({
        fromChainId: chainId as 1 | 8453,
        fromToken: chainId === 1 ? USDC_ETH : USDC_BASE,
        fromAddress: address,
        fromAmount: totalUsdce.toString(),
        contractCalls,
      });
      setChips(["done", "pending", "idle"]);
      const route = convertQuoteToRoute(quote);
      await executeRoute(route, {
        updateRouteHook: (r) => {
          const done = r.steps.filter((s) => s.execution?.status === "DONE").length;
          setChips([done >= 1 ? "done" : "pending", done >= 2 ? "done" : "pending", done >= 3 ? "done" : "idle"]);
          const hash = r.steps.flatMap((s) => s.execution?.process ?? []).map((p) => p.txHash).filter(Boolean).pop();
          if (hash) setTxHash(hash);
        },
      });
      setChips(["done", "done", "done"]);
      setResult("success");
      setStep(4);
    } catch (e) {
      setErrMsg((e as Error).message);
      setResult("refund");
      setStep(4);
    } finally {
      setSigning(false);
    }
  }

  return (
    <div style={overlay} onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#14161B",
          border: "1px solid #2A2D34",
          borderRadius: 12,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          animation: "lynxSheet .26s cubic-bezier(.2,.7,.3,1)",
        }}
      >
        {/* header + stepper */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px 0" }}>
          <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 17, color: "#FFFFFF" }}>
            Enter the {title} basket
          </h2>
          <button onClick={close} style={{ width: 28, height: 28, display: "grid", placeItems: "center", background: "transparent", border: "1px solid #2A2D34", borderRadius: 7, color: "#AAB1BC", cursor: "pointer" }}>
            ✕
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, padding: "18px 22px" }}>
          {labels.map((l, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <span key={l} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 11, color: done ? "#3FBE85" : active ? "#E8EBEF" : "#5C636D" }}>
                <span style={{ width: 16, height: 16, display: "grid", placeItems: "center", borderRadius: "50%", border: `1px solid ${done ? "#3FBE85" : active ? "#E8EBEF" : "#2A2D34"}`, fontSize: 9 }}>
                  {done ? "✓" : n}
                </span>
                {l}
              </span>
            );
          })}
        </div>
        <div style={{ height: 1, background: "#2A2D34" }} />

        {/* STEP 1 — Connect */}
        {step === 1 && (
          <div style={{ padding: 22, animation: "lynxFade .2s ease" }}>
            <h3 style={{ margin: "0 0 7px", fontFamily: DISPLAY, fontWeight: 700, fontSize: 16, color: "#FFFFFF" }}>Connect a wallet</h3>
            <p style={{ margin: "0 0 18px", fontSize: 13.5, lineHeight: 1.55, color: "#AAB1BC" }}>
              Connect on <span style={{ color: "#FFFFFF" }}>Ethereum</span> or <span style={{ color: "#FFFFFF" }}>Base</span>. Entry never
              originates on Arc or Polygon — we route it for you.
            </p>
            {!isConnected ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {connectors.slice(0, 2).map((c) => (
                  <button
                    key={c.uid}
                    onClick={() => connect({ connector: c })}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 50, padding: "0 16px", background: "#1B1E24", border: "1px solid #2A2D34", borderRadius: 9, cursor: "pointer", color: "#FFFFFF", fontFamily: BODY, fontSize: 14 }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#A6B2C2" }} />
                      Connect {c.name}
                    </span>
                    <span style={{ color: "#7A828D" }}>→</span>
                  </button>
                ))}
              </div>
            ) : !onAllowedChain ? (
              <div style={{ animation: "lynxFade .2s ease" }}>
                <div style={{ display: "flex", gap: 11, padding: "14px 15px", background: "rgba(229,84,75,0.08)", border: "1px solid rgba(229,84,75,0.35)", borderRadius: 9, marginBottom: 12 }}>
                  <span style={{ color: "#E5544B", flexShrink: 0 }}>!</span>
                  <div>
                    <span style={{ display: "block", fontSize: 13.5, color: "#FFFFFF", marginBottom: 2 }}>You&apos;re on the wrong network.</span>
                    <span style={{ fontSize: 12.5, color: "#AAB1BC" }}>Entry must originate on Ethereum or Base. Switch network to continue.</span>
                  </div>
                </div>
                <button onClick={() => switchChain({ chainId: 8453 })} style={btnCta({ width: "100%", height: 46 })}>
                  Switch to Base
                </button>
              </div>
            ) : (
              <button onClick={() => setStep(2)} style={btnCta({ width: "100%", height: 48 })}>
                Continue → ({chainId === 1 ? "Ethereum" : "Base"})
              </button>
            )}
          </div>
        )}

        {/* STEP 2 — Review */}
        {step === 2 && (
          <div style={{ padding: 22, animation: "lynxFade .2s ease" }}>
            <h3 style={{ margin: "0 0 14px", fontFamily: DISPLAY, fontWeight: 700, fontSize: 16, color: "#FFFFFF" }}>Review your order</h3>
            <div style={{ background: "#1B1E24", border: "1px solid #2A2D34", borderRadius: 9, padding: "4px 16px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #2A2D34" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "#FFFFFF" }}>
                  <span style={{ color: "#8A95A6", fontSize: 9 }}>●</span>Neutral YES+NO set · {predCount} market{predCount === 1 ? "" : "s"}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 12.5, color: "#AAB1BC" }}>USDC.e</span>
              </div>
              {legs.filter((l) => l.kind === "asset").map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "#FFFFFF" }}>
                    <span style={{ color: "#E8EBEF", fontSize: 9 }}>◆</span>{l.label}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 12.5, color: "#AAB1BC" }}>{Math.round(l.weight * 100)}% weight</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 8 }}>
              <Row k="You pay" v={`${fmt(amount)} USDC`} />
              <Row k="Delivered to" v={recipient} />
              <Row k="Custody" v="Non-custodial — your wallet" vColor="#3FBE85" mono={false} />
            </div>
            <div style={{ display: "flex", gap: 11, marginTop: 18 }}>
              <button onClick={() => setStep(1)} style={btnGhost()}>Back</button>
              <button onClick={() => setStep(3)} style={btnCta({ flex: 1 })}>Looks right · continue</button>
            </div>
          </div>
        )}

        {/* STEP 3 — Sign */}
        {step === 3 && (
          <div style={{ padding: 22, animation: "lynxFade .2s ease" }}>
            <h3 style={{ margin: "0 0 7px", fontFamily: DISPLAY, fontWeight: 700, fontSize: 16, color: "#FFFFFF" }}>One signature</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13.5, lineHeight: 1.55, color: "#AAB1BC" }}>
              LI.FI Composer assembles the whole route from your signature and splits the deposit across the bucket&apos;s markets.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Swap", "Bridge · to Polygon", "EnterBasket · split across markets"].map((c, i) => (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "#1B1E24", border: "1px solid #2A2D34", borderRadius: 9, fontFamily: MONO, fontSize: 12.5, color: chips[i] === "idle" ? "#5C636D" : "#FFFFFF" }}>
                  <span style={{ color: chips[i] === "done" ? "#3FBE85" : "#E8EBEF", animation: chips[i] === "pending" ? "lynxPulse 1s infinite" : undefined }}>
                    {chips[i] === "done" ? "✓" : "●"}
                  </span>
                  {c}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18 }}>
              {!signing ? (
                <div style={{ display: "flex", gap: 11 }}>
                  <button onClick={() => setStep(2)} style={btnGhost()}>Back</button>
                  <button onClick={sign} style={btnCta({ flex: 1 })}>
                    <span style={{ fontSize: 11 }}>◆</span>Sign · one signature
                  </button>
                </div>
              ) : (
                <button disabled style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, height: 46, background: "#1B1E24", border: "1px solid #2A2D34", borderRadius: 8, fontFamily: MONO, fontSize: 13, color: "#AAB1BC" }}>
                  <span style={{ color: "#E8EBEF", animation: "lynxPulse 1s infinite" }}>●</span>Routing…
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 4 — Result */}
        {step === 4 && (
          <div style={{ padding: 22, animation: "lynxFade .2s ease" }}>
            {result === "success" ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
                  <span style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: "50%", background: "rgba(63,190,133,0.14)", border: "1px solid rgba(63,190,133,0.4)", color: "#3FBE85", fontSize: 15 }}>✓</span>
                  <div>
                    <h3 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, fontSize: 16, color: "#FFFFFF" }}>Positions delivered</h3>
                    <span style={{ fontSize: 12.5, color: "#AAB1BC" }}>To your wallet · non-custodial</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                  <span style={{ fontSize: 11, color: "#7A828D" }}>Transactions</span>
                  <TxLink label={`EnterBasket · ${txHash ? txHash.slice(0, 8) + "…" + txHash.slice(-4) : "pending"}`} href={txHash ? `https://polygonscan.com/tx/${txHash}` : "#"} />
                </div>
                <div style={{ padding: "13px 15px", border: "1px dashed #2A2D34", borderRadius: 9, marginBottom: 18 }}>
                  <span style={{ display: "block", fontSize: 11, color: "#7A828D", marginBottom: 7 }}>Separate verified evidence — standalone Uniswap swap (not part of the basket)</span>
                  <TxLink label={`◆ ${UNISWAP_EVIDENCE.slice(0, 8)}…${UNISWAP_EVIDENCE.slice(-6)}`} href={`https://polygonscan.com/tx/${UNISWAP_EVIDENCE}`} bare />
                </div>
                <button onClick={close} style={btnGhost({ width: "100%", color: "#FFFFFF" })}>Done</button>
              </div>
            ) : (
              <div style={{ animation: "lynxFade .2s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
                  <span style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: "50%", background: "rgba(232,235,239,0.12)", border: "1px solid rgba(232,235,239,0.4)", color: "#E8EBEF", fontSize: 15 }}>↩</span>
                  <div>
                    <h3 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, fontSize: 16, color: "#FFFFFF" }}>Didn&apos;t complete — nothing stranded</h3>
                    <span style={{ fontSize: 12.5, color: "#AAB1BC" }}>Revert-safe by design</span>
                  </div>
                </div>
                <p style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.6, color: "#AAB1BC" }}>
                  The route didn&apos;t complete, so nothing was opened. Your <span style={{ fontFamily: MONO, color: "#FFFFFF" }}>USDC</span> stays in your wallet —
                  <span style={{ color: "#7A828D" }}> {errMsg || "no funds moved"}.</span>
                </p>
                <div style={{ display: "flex", gap: 11 }}>
                  <button onClick={close} style={btnGhost()}>Close</button>
                  <button onClick={() => { setResult(null); setStep(1); }} style={btnCta({ flex: 1 })}>Try again</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, vColor, mono = true }: { k: string; v: string; vColor?: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
      <span style={{ color: "#AAB1BC" }}>{k}</span>
      <span style={{ fontFamily: mono ? MONO : BODY, color: vColor ?? "#FFFFFF" }}>{v}</span>
    </div>
  );
}

function TxLink({ label, href, bare = false }: { label: string; href: string; bare?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        textDecoration: "none",
        padding: bare ? 0 : "10px 13px",
        background: bare ? "transparent" : "#0E1014",
        border: bare ? "0" : "1px solid #20242A",
        borderRadius: 8,
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: 12, color: "#AAB1BC" }}>{label}</span>
      <span style={{ fontSize: 11, color: "#8A95A6" }}>Polygonscan ↗</span>
    </a>
  );
}
