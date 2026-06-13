"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { formatUnits } from "viem";
import { createArcPasskeyAccount, readArcUsdcBalance } from "@/lib/arc/wallet";

type ArcState = {
  address?: string;
  usdc?: number;
  status: string;
  connected: boolean;
  connect: (mode: "register" | "login") => Promise<void>;
};

const Ctx = createContext<ArcState | null>(null);

/** App-wide Arc passkey account state so the top-bar chip, the dashboard NAV bar, and the account
 *  slide-over all reflect one wallet. Passkey-only (no seed phrase); USDC is the real on-chain balance. */
export function ArcProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string>();
  const [usdc, setUsdc] = useState<number>();
  const [status, setStatus] = useState("");

  async function connect(mode: "register" | "login") {
    try {
      setStatus("Opening passkey…");
      const KEY = "lynx-arc-username";
      let username = typeof window !== "undefined" ? window.localStorage.getItem(KEY) ?? undefined : undefined;
      if (mode === "register" || !username) {
        username = `lynx-${Date.now().toString(36)}`;
        if (typeof window !== "undefined") window.localStorage.setItem(KEY, username);
      }
      const { client, account } = await createArcPasskeyAccount(username, mode);
      setAddress(account.address);
      const bal = await readArcUsdcBalance(client, account.address);
      setUsdc(Number(formatUnits(bal, 6)));
      setStatus("");
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  return <Ctx.Provider value={{ address, usdc, status, connected: !!address, connect }}>{children}</Ctx.Provider>;
}

export function useArc(): ArcState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useArc must be used within ArcProvider");
  return c;
}
