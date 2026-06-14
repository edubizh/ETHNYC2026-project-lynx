import "server-only";
import { ADDR } from "@/lib/addresses";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

// HARD-FAIL at startup if the Uniswap key is absent — the $7k prize swap can't run without it.
// (Server-only module: imported by the data service + API route + scripts, never by client components.)
if (!process.env.UNISWAP_API_KEY) {
  throw new Error("UNISWAP_API_KEY is required (hard-fail at startup) — set it in .env");
}

export const config = {
  arcRpc: () => req("ARC_TESTNET_RPC"), // account/NAV only
  polygonRpc: () => req("POLYGON_RPC"), // Tenderly VNet or public Polygon 137 RPC for dev/sim
  uniswap: { base: () => req("UNISWAP_TRADING_API_BASE"), key: () => req("UNISWAP_API_KEY") },
  equitiesKey: () => req("EQUITIES_API_KEY"), // display-only equities feed (NVDA quote -> asset band)
  // Verified PUBLIC addresses (single source of truth = lib/addresses.ts; checksummed at load).
  addrs: {
    usdce: () => ADDR.usdce,
    usdcNative: () => ADDR.usdcNative,
    negRiskAdapter: () => ADDR.negRiskAdapter,
    wcol: () => ADDR.wcol,
    ctf: () => ADDR.ctf,
    wsteth: () => ADDR.wsteth,
    universalRouter: () => ADDR.universalRouter,
    permit2: () => ADDR.permit2,
  },
} as const;
