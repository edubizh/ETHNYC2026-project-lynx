"use client";

import { useState } from "react";
import { useAccount, useConnect, useWalletClient } from "wagmi";
import { initLifi, buildEnterQuote, convertQuoteToRoute, executeRoute } from "@/lib/lifi/enter";
import { buildBasketContractCalls } from "@/lib/lifi/basket";

const DISPLAY = "'Inter Tight', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // native USDC on Base
const USDC_ETH = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // native USDC on Ethereum
const ENTER_BASKET = process.env.NEXT_PUBLIC_ENTER_BASKET ?? "0x0000000000000000000000000000000000000000";

// Monochrome allocation segment shades (belief → asset), per the design.
const SEG = ["#8A95A6", "#A6B2C2", "#C4C9D1", "#E8EBEF"];

export type BuyLeg = { label: string; kind: "prediction" | "asset"; weight: number };

const CTA = "linear-gradient(180deg,#F4F6F8,#C4C9D1)";

export function BuyBox({ slug, legs }: { slug: string; legs: BuyLeg[] }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: walletClient } = useWalletClient();
  const [amountStr, setAmountStr] = useState("250");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const amount = Math.max(0, Number(amountStr.replace(/[^0-9.]/g, "")) || 0);
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const split = legs.map((l, i) => ({ ...l, color: SEG[i % SEG.length], usd: amount * l.weight }));

  async function onEnter() {
    try {
      if (!isConnected) {
        const c = connectors[0];
        if (!c) return setStatus("No wallet connector available.");
        connect({ connector: c });
        return;
      }
      if (!address || !walletClient) return setStatus("Connect a wallet on Ethereum or Base first.");
      const chainId = walletClient.chain?.id;
      if (chainId !== 1 && chainId !== 8453)
        return setStatus("Switch to Ethereum or Base — entry never originates on Arc or Polygon.");
      if (ENTER_BASKET === "0x0000000000000000000000000000000000000000")
        return setStatus("Set NEXT_PUBLIC_ENTER_BASKET to the deployed EnterBasket address.");
      if (amount <= 0) return setStatus("Enter an amount.");

      setBusy(true);
      setStatus("Building one-signature LI.FI route…");
      const totalUsdce = BigInt(Math.round(amount * 1e6)); // USDC.e (6dp)
      const contractCalls = buildBasketContractCalls(slug, totalUsdce, address as `0x${string}`, ENTER_BASKET as `0x${string}`);
      initLifi({ getWalletClient: async () => walletClient, switchChain: async () => walletClient });
      const step = await buildEnterQuote({
        fromChainId: chainId as 1 | 8453,
        fromToken: chainId === 1 ? USDC_ETH : USDC_BASE,
        fromAddress: address,
        fromAmount: totalUsdce.toString(),
        contractCalls,
      });
      setStatus("Route built. Executing (one signature)…");
      const route = convertQuoteToRoute(step);
      await executeRoute(route, {
        updateRouteHook: (r) => setStatus("status: " + r.steps.map((s) => s.execution?.status ?? "PENDING").join(" → ")),
      });
      setStatus("Done — positions delivered to your wallet.");
    } catch (e) {
      setStatus("Error: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const quick = (v: string) => () => setAmountStr(v);

  return (
    <section
      style={{
        background: "#14161B",
        border: "1px solid rgba(232,235,239,0.28)",
        borderRadius: 10,
        padding: "22px 24px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", gap: 28, alignItems: "stretch", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <span style={{ display: "block", fontSize: 11, color: "#7A828D", marginBottom: 8 }}>Amount to enter</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 48,
                padding: "0 14px",
                background: "#1B1E24",
                border: "1px solid #2A2D34",
                borderRadius: 9,
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 13, color: "#7A828D" }}>USDC</span>
              <input
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                inputMode="decimal"
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: "right",
                  background: "transparent",
                  border: 0,
                  outline: "none",
                  color: "#FFFFFF",
                  fontFamily: MONO,
                  fontSize: 19,
                  fontFeatureSettings: "'tnum' 1",
                }}
              />
            </div>
            {["100", "250", "500"].map((v) => (
              <button
                key={v}
                onClick={quick(v)}
                style={{
                  height: 48,
                  padding: "0 12px",
                  background: "transparent",
                  border: "1px solid #2A2D34",
                  borderRadius: 8,
                  fontFamily: MONO,
                  fontSize: 12,
                  color: "#AAB1BC",
                  cursor: "pointer",
                }}
              >
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
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 18,
                marginTop: 13,
                fontFamily: MONO,
                fontSize: 11.5,
                fontFeatureSettings: "'tnum' 1",
              }}
            >
              {split.map((s, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#AAB1BC" }}>
                  <span style={{ width: 8, height: 8, borderRadius: s.kind === "asset" ? 1 : "50%", background: s.color, transform: s.kind === "asset" ? "rotate(45deg)" : undefined }} />
                  {shortLabel(s.label)} {Math.round(s.weight * 100)}% <span style={{ color: "#7A828D" }}>·</span>{" "}
                  <span style={{ color: "#FFFFFF" }}>${fmt(s.usd)}</span>
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
            onClick={onEnter}
            disabled={busy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              height: 48,
              background: CTA,
              border: 0,
              borderRadius: 8,
              fontFamily: DISPLAY,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              fontSize: 15,
              color: "#0A0B0E",
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            <span style={{ fontSize: 11 }}>◆</span>
            {isConnected ? "Enter basket · one signature" : "Connect wallet"}
          </button>
          <span style={{ fontSize: 11, lineHeight: 1.5, color: "#7A828D", textAlign: "center" }}>
            Non-custodial · neutral YES+NO set, delivered to your wallet.
          </span>
        </div>
      </div>
      {status && (
        <p style={{ margin: "14px 0 0", fontFamily: MONO, fontSize: 11.5, color: "#AAB1BC" }}>{status}</p>
      )}
    </section>
  );
}

/** Trim a leg label to a short token for the allocation legend (e.g. "OpenAI does NOT IPO…" → "OpenAI"). */
function shortLabel(label: string): string {
  const first = label.split(/[\s·(]/)[0];
  return first.length >= 3 ? first : label.slice(0, 8);
}
