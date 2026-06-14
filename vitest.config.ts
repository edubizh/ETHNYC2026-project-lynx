import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// Map `@/...` -> repo root (mirrors tsconfig paths) so lib + test share one source of truth.
const root = resolve(process.cwd());

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: root + "/" },
      // `import "server-only"` (lib/config.ts) is a Next build-time guard that THROWS outside an RSC
      // bundle. Tests run in node (not RSC), so map it to the package's own no-op `empty.js` — the same
      // module Next resolves via the `react-server` export condition. Keeps the guard real in the build
      // while letting server modules be unit-tested. Surgical: affects only `server-only`.
      { find: /^server-only$/, replacement: resolve(root, "node_modules/server-only/empty.js") },
    ],
  },
  test: {
    globals: true,
    include: ["test/**/*.test.ts"],
    // lib/config.ts HARD-FAILS at import if UNISWAP_API_KEY is missing, and reads addresses
    // via getAddress(). Provide the (public, non-secret) values the unit tests touch.
    env: {
      UNISWAP_API_KEY: "test-key",
      UNISWAP_TRADING_API_BASE: "https://trade-api.test/v1",
      EQUITIES_API_KEY: "test-equities",
      ARC_TESTNET_RPC: "https://rpc.testnet.arc.network",
      POLYGON_RPC: "https://polygon-bor-rpc.publicnode.com",
      USDC_NATIVE_POLYGON: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      USDCE_POLYGON: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      NEGRISK_ADAPTER: "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296",
      WCOL: "0x3A3BD7bb9528E159577F7C2e685CC81A765002E2",
      CTF_POLYGON: "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045",
      WSTETH_POLYGON: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD",
      UNIVERSAL_ROUTER_POLYGON: "0x1095692A6237d83C6a72F3F5eFEdb9A670C49223",
      PERMIT2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    },
  },
});
