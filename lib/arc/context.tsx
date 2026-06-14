"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { formatUnits } from "viem";
import { createArcPasskeyAccount, readArcUsdcBalance, sendArcGaslessUserOp, type ArcWallet } from "@/lib/arc/wallet";

type ArcState = {
  address?: string;
  usdc?: number;
  status: string;
  connected: boolean;
  connect: (mode: "register" | "login") => Promise<void>;
  /** Send one USDC-gas (paymaster) userOp on Arc Testnet — the load-bearing Arc qualification artifact. */
  sendGaslessUserOp: () => Promise<void>;
  /** Progress / error text for the gasless userOp (empty when idle/success). */
  opStatus: string;
  /** On-chain tx hash of the last successful userOp (for the ArcScan link). */
  opTxHash?: string;
};

const Ctx = createContext<ArcState | null>(null);

/** App-wide Arc passkey account state so the top-bar chip, the dashboard NAV bar, and the account
 *  slide-over all reflect one wallet. Passkey-only (no seed phrase); USDC is the real on-chain balance. */
export function ArcProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string>();
  const [usdc, setUsdc] = useState<number>();
  const [status, setStatus] = useState("");
  const [opStatus, setOpStatus] = useState("");
  const [opTxHash, setOpTxHash] = useState<string>();
  // The live wallet bundle (account + bundler + client). A ref, not state: consumed by actions, not rendered.
  const walletRef = useRef<ArcWallet | null>(null);

  async function connect(mode: "register" | "login") {
    try {
      setStatus("Opening passkey…");
      const KEY = "lynx-arc-username";
      let username = typeof window !== "undefined" ? window.localStorage.getItem(KEY) ?? undefined : undefined;
      if (mode === "register" || !username) {
        username = `lynx-${Date.now().toString(36)}`;
        if (typeof window !== "undefined") window.localStorage.setItem(KEY, username);
      }
      const wallet = await createArcPasskeyAccount(username, mode);
      walletRef.current = wallet;
      setAddress(wallet.account.address);
      const bal = await readArcUsdcBalance(wallet.client, wallet.account.address);
      setUsdc(Number(formatUnits(bal, 6)));
      setStatus("");
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  async function sendGaslessUserOp() {
    try {
      setOpTxHash(undefined);
      const wallet = walletRef.current;
      if (!wallet) throw new Error("Create or sign in with a passkey wallet first.");
      setOpStatus("Sending USDC-gas userOp…");
      const txHash = await sendArcGaslessUserOp(wallet);
      setOpTxHash(txHash);
      setOpStatus("");
      // Gas is paid in USDC → refresh the balance so the NAV reflects it.
      const bal = await readArcUsdcBalance(wallet.client, wallet.account.address);
      setUsdc(Number(formatUnits(bal, 6)));
    } catch (e) {
      setOpStatus((e as Error).message);
    }
  }

  return (
    <Ctx.Provider value={{ address, usdc, status, connected: !!address, connect, sendGaslessUserOp, opStatus, opTxHash }}>
      {children}
    </Ctx.Provider>
  );
}

export function useArc(): ArcState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useArc must be used within ArcProvider");
  return c;
}
