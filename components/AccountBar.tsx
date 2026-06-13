"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { createArcPasskeyAccount, readArcUsdcBalance } from "@/lib/arc/wallet";

// Unified NAV = USDC on Arc (account layer) + the value of the Polygon basket legs.
export function AccountBar({ polygonNav }: { polygonNav: number }) {
  const [addr, setAddr] = useState<string>();
  const [arcUsdc, setArcUsdc] = useState<number>();
  const [status, setStatus] = useState("");

  async function connectArc(mode: "register" | "login") {
    try {
      setStatus("Opening passkey…");
      // Register with a UNIQUE username (Circle rejects duplicates); persist it so Login reuses it.
      const KEY = "lynx-arc-username";
      let username = typeof window !== "undefined" ? window.localStorage.getItem(KEY) ?? undefined : undefined;
      if (mode === "register" || !username) {
        username = `lynx-${Date.now().toString(36)}`;
        if (typeof window !== "undefined") window.localStorage.setItem(KEY, username);
      }
      const { client, account } = await createArcPasskeyAccount(username, mode);
      setAddr(account.address);
      const bal = await readArcUsdcBalance(client, account.address);
      setArcUsdc(Number(formatUnits(bal, 6)));
      setStatus("");
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  const arc = arcUsdc ?? 0;
  const nav = arc + polygonNav;

  return (
    <div className="panel">
      <h2>Account · Arc (passkey, USDC-gas)</h2>
      {addr ? (
        <div className="row">
          <div className="stat">
            <div className="k">Smart account</div>
            <div className="v" style={{ fontSize: 13 }}>
              {addr.slice(0, 10)}…{addr.slice(-6)}
            </div>
          </div>
          <div className="stat">
            <div className="k">USDC on Arc</div>
            <div className="v">${arc.toFixed(2)}</div>
          </div>
          <div className="stat">
            <div className="k">Unified NAV (Arc + Polygon)</div>
            <div className="v">${nav.toFixed(2)}</div>
          </div>
        </div>
      ) : (
        <div className="row">
          <button className="cta secondary" onClick={() => connectArc("login")}>
            Sign in with passkey
          </button>
          <button className="cta secondary" onClick={() => connectArc("register")}>
            Create passkey wallet
          </button>
        </div>
      )}
      {status && (
        <p className="subtle" style={{ marginTop: 10 }}>
          {status}
        </p>
      )}
    </div>
  );
}
