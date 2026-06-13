import { getAddress, type Address } from "viem";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}
/** Checksum + validate every address at the config boundary. */
function addr(name: string): Address {
  return getAddress(req(name));
}

// HARD-FAIL at startup if the Uniswap key is absent — the $7k prize swap can't run without it.
if (!process.env.UNISWAP_API_KEY) {
  throw new Error("UNISWAP_API_KEY is required (hard-fail at startup) — set it in .env");
}

export const config = {
  arcRpc: () => req("ARC_TESTNET_RPC"), // account/NAV only
  polygonRpc: () => req("POLYGON_RPC"), // Tenderly VNet or public Polygon 137 RPC for dev/sim
  uniswap: { base: () => req("UNISWAP_TRADING_API_BASE"), key: () => req("UNISWAP_API_KEY") },
  equitiesKey: () => req("EQUITIES_API_KEY"), // display-only equities feed (NVDA quote -> asset band)
  addrs: {
    usdce: () => addr("USDCE_POLYGON"), // NegRiskAdapter collateral
    usdcNative: () => addr("USDC_NATIVE_POLYGON"), // LI.FI destination token
    negRiskAdapter: () => addr("NEGRISK_ADAPTER"),
    wcol: () => addr("WCOL"), // WrappedCollateral
    ctf: () => addr("CTF_POLYGON"),
    wsteth: () => addr("WSTETH_POLYGON"),
    universalRouter: () => addr("UNIVERSAL_ROUTER_POLYGON"),
    permit2: () => addr("PERMIT2"),
  },
} as const;
