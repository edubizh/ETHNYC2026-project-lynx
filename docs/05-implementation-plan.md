# Project-Lynx MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Execute this in the NEW hackathon repo** (after copying the `docs/build/` package over). Read `docs/01..04` first.

**Goal:** Ship the Project-Lynx MVP — a one-theme (AI) prediction-market index + divergence dashboard where a user enters a curated basket (real Polymarket NegRisk positions + a tokenized-stock leg) in one signature, with an Arc-based account.

**Architecture:** Approach B+ — Next.js frontend + off-chain data service (Polymarket Gamma + Uniswap `/quote` → divergence engine), a Solidity `EnterBasket` executor on **Polygon mainnet (137)** doing real, tiny ($1–5) txs (NegRiskAdapter `splitPosition` for the prediction leg + a Universal Router/Sushi swap for the asset leg), and LI.FI for one-signature cross-chain entry **funded from Ethereum (1) or Base (8453)** — never from Arc (Arc→Polygon routing is dead: `{connections:[]}`). **Arc Testnet (`5042002`) is the account/NAV layer ONLY.** Dev/sim runs against a **Tenderly Virtual TestNet fork of Polygon** (its admin RPC is `POLYGON_RPC`).

**Tech Stack:** Next.js + React + TypeScript + wagmi/viem · vitest · `@lifi/sdk` + LI.FI Widget · Uniswap Trading API + `@uniswap/sdk-core` · Circle Modular Wallets · Solidity + Foundry · Polymarket **NegRiskAdapter** + **WrappedCollateral (wcol)** (collateral is **USDC.e** via the adapter) · **Tenderly Virtual TestNet (Polygon fork)** · Arc Testnet (`5042002`, account/NAV only) + Polygon mainnet (137, execution).

**Granularity note:** Pure-logic units (divergence engine, basket math, data adapters) and the contract are written **TDD** (test→fail→impl→pass→commit). Scaffolding, UI, and external-wiring tasks are concrete task blocks with exact commands rather than micro-TDD, because they depend on live testnet/booth values (see `docs/04` Day-1 de-risk). External values are read from typed env config (a config task lists every var + its source) — that is intentional, not a placeholder.

---

## VERIFIED FACTS (2026-06-13) — pinned, on-chain verified

> These are the canonical values for the build (Approach B+). All addresses are checksummed; **wrap every one in viem `getAddress()`** at the config boundary. Do **not** relitigate these.

**Chains:** execution = **Polygon mainnet `137`** (real tiny txs); LI.FI entry source = **Ethereum `1`** or **Base `8453`** (NEVER Arc — Arc→Polygon = `{connections:[]}`); account/NAV only = **Arc Testnet `5042002`**; dev/sim = **Tenderly VNet fork of Polygon** (admin RPC = `POLYGON_RPC`).

**Polymarket prediction leg:** **NegRisk** markets, collateral = **USDC.e** (verified `NegRiskAdapter.col()`; NOT pUSD / native USDC). `NegRiskAdapter.splitPosition(conditionId, amount)` → NEUTRAL YES+NO set; outcome tokens mint against **WrappedCollateral (wcol)** internally. positionIds are read from **`NegRiskAdapter.getPositionId(questionId, bool)`** — it takes the **QUESTION id**; `(questionId,true)=YES`, `(questionId,false)=NO`. **NEVER** derive via `ctf.getPositionId(USDC.e, getCollectionId(0x0,conditionId,indexSet))`. Directional buys are an operator-gated CLOB (not composable). `recipient` is an explicit **calldata EOA param** (NOT `msg.sender` — the Across executor that lands the call is a contract).

**Addresses (checksummed — `getAddress()`):**
| Name | Address |
|---|---|
| `NEGRISK_ADAPTER` | `0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296` |
| `WCOL` (WrappedCollateral) | `0x3A3BD7bb9528E159577F7C2e685CC81A765002E2` |
| `CTF` (ConditionalTokens) | `0x4D97DCd97eC945f40cF65F87097ACe5EA0476045` |
| `USDCe` (collateral) | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` |
| `USDC_NATIVE` (LI.FI toToken) | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` |
| `WSTETH` | `0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD` |
| `UNIVERSAL_ROUTER` (V4) | `0x1095692A6237d83C6a72F3F5eFEdb9A670C49223` |
| `PERMIT2` | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |

**Basket markets (real conditionIds):**
- **OpenAI-not-IPO-by-Dec-2026** — `conditionId 0x3849e1d62e0807801913d3e2427e8caf3cc6dd1c8ef42d8d5c08c6f9c449dc5e` (ends **2027-01-01**) → **PRIMARY / always-valid leg** (~51% YES). clobTokenIds: YES=`56615676606297588259337956203332341775475048285080710344367729433788967812170`, NO=`8070607953656787024050950499598687532281829563384949938603247089607814583142`. Live `outcomePrices` for mocks: **0.51 / 0.49**.
- **Anthropic-top-AI-model** — `conditionId 0x0811ed7f71c2466d04f9ba801c0e21c9cfb016385cdff97b5c9984df0fa5801e` (ends **2026-06-30**) → **secondary / vivid leg** (~89.5% YES). clobTokenIds: YES=`64887172491629329116501561142670952112197574356607923997934182163296576951634`, NO=`12813183214224132107278873250345740614275647031034326420266129033763649478747`. Live `outcomePrices` for mocks: **0.895 / 0.105**.
- AI-model **`negRiskMarketID 0x3dcd0f5c7c6df89336a87be866327c862646e18b5deee05f31c250451b3a2900`**.

**Parsing gotchas:** Gamma `outcomePrices` is a **STRINGIFIED JSON array** (`JSON.parse` it before indexing). Uniswap `/quote` `q.quote` is a **STRING amount** (no nested `output.token.decimals`); require a `swapper` field and send the `x-api-key` header.

**Hero framing:** the headline metric is the **"AI Sentiment Gap"** = `assetBandPercentile` within a **published analyst bear/bull band** vs the belief-market odds — never the phrase "implied probability".

**Uniswap $7k prize:** a **SEPARATE standalone** Trading-API `/swap` real tx (the basket asset leg routes via Sushi and does **not** earn the prize). `/quote` is the price oracle. `UNISWAP_API_KEY` must **hard-fail at startup**.

**Dropped:** USYC, StableFX/EURC, Chainlink dependency.

---

## File structure

```
project-lynx/
├─ CLAUDE.md                      # (copied from package)
├─ docs/                          # (copied from package: README + 01..05)
├─ app/                           # Next.js (frontend + API routes = the data service)
│  ├─ app/page.tsx                # theme browser
│  ├─ app/theme/[slug]/page.tsx   # per-theme dashboard + divergence panel + Enter
│  ├─ app/api/theme/[slug]/route.ts  # data-service endpoint
│  └─ components/{DivergencePanel,BasketTable,EnterButton,AccountBar}.tsx
├─ lib/
│  ├─ config.ts                   # typed env config (single source of truth)
│  ├─ baskets/registry.ts         # theme/basket definitions + loader
│  ├─ baskets/types.ts
│  ├─ divergence/engine.ts        # the differentiator (pure logic)
│  ├─ adapters/polymarket.ts      # Gamma odds adapter (outcomePrices = stringified JSON)
│  ├─ adapters/uniswap.ts         # /quote price oracle (q.quote = string amount)
│  ├─ uniswap/prizeSwap.ts        # standalone Trading-API /swap — the $7k artifact (Task 6b)
│  └─ dashboard/service.ts        # composes adapters + divergence
├─ contracts/                     # Foundry
│  ├─ src/EnterBasket.sol
│  ├─ test/EnterBasket.t.sol
│  └─ foundry.toml
└─ test/                          # vitest unit tests for lib/
```

---

## Task 0: Repo scaffold & typed config

**Files:**
- Create: `app/` (Next.js), `contracts/` (Foundry), `lib/config.ts`, `.env.example`, `vitest.config.ts`

- [ ] **Step 1: Init the Next.js app and Foundry project**

```bash
npx create-next-app@latest app --ts --app --eslint --src-dir=false --import-alias "@/*" --no-tailwind
cd app && npm i wagmi viem @tanstack/react-query @lifi/sdk @lifi/widget @uniswap/sdk-core vitest && cd ..
mkdir contracts && cd contracts && forge init --no-git . && cd ..
```

- [ ] **Step 2: Create `.env.example` listing every required value + its source**

```bash
# --- Chains ---
ARC_TESTNET_RPC=https://rpc.testnet.arc.network        # docs.arc.network — account/NAV only
POLYGON_RPC=                                            # Tenderly VNet admin RPC (Polygon 137 fork) for dev/sim
# --- API keys (from sponsor dashboards / booths, see docs/04) ---
UNISWAP_TRADING_API_BASE=                               # Uniswap Trading API Developer Platform
UNISWAP_API_KEY=                                        # Uniswap Developer Platform — HARD-FAIL at startup if missing
EQUITIES_API_KEY=                                       # display-only equities feed (e.g. NVDA quote) for the asset band
LIFI_API_KEY=                                           # optional; @lifi/sdk works keyless for dev
CIRCLE_CLIENT_KEY=                                      # Circle Modular Wallets console
# --- Addresses (VERIFIED 2026-06-13 — see VERIFIED FACTS banner; all wrapped in getAddress()) ---
USDCE_POLYGON=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174       # USDC.e — NegRiskAdapter collateral (verified .col())
USDC_NATIVE_POLYGON=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 # native USDC — LI.FI toToken on Polygon
NEGRISK_ADAPTER=0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296     # Polymarket NegRiskAdapter (splitPosition + getPositionId)
WCOL=0x3A3BD7bb9528E159577F7C2e685CC81A765002E2                # WrappedCollateral (wcol) — adapter mints outcomes against this
CTF_POLYGON=0x4D97DCd97eC945f40cF65F87097ACe5EA0476045         # ConditionalTokens (ERC1155 holding outcome tokens)
WSTETH_POLYGON=0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD      # wstETH — asset-leg target option
UNIVERSAL_ROUTER_POLYGON=0x1095692A6237d83C6a72F3F5eFEdb9A670C49223  # Uniswap Universal Router (V4) on Polygon
PERMIT2=0x000000000022D473030F116dDEE9F6B43aC78BA3             # canonical Permit2 (all chains)
```

> **Collateral correction:** the prediction leg's collateral is **USDC.e** routed through the **NegRiskAdapter** (which wraps it to `wcol` internally) — NOT pUSD, NOT a CollateralOnramp, NOT native USDC. Native USDC appears only as the LI.FI destination token.

- [ ] **Step 3: Create `lib/config.ts` (single typed source of truth)**

```ts
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
  arcRpc: () => req("ARC_TESTNET_RPC"),               // account/NAV only
  polygonRpc: () => req("POLYGON_RPC"),               // Tenderly VNet (Polygon 137 fork) for dev/sim
  uniswap: { base: () => req("UNISWAP_TRADING_API_BASE"), key: () => req("UNISWAP_API_KEY") },
  equitiesKey: () => req("EQUITIES_API_KEY"),         // display-only equities feed (NVDA quote → asset band)
  addrs: {
    usdce: () => addr("USDCE_POLYGON"),               // NegRiskAdapter collateral
    usdcNative: () => addr("USDC_NATIVE_POLYGON"),    // LI.FI destination token
    negRiskAdapter: () => addr("NEGRISK_ADAPTER"),
    wcol: () => addr("WCOL"),                          // WrappedCollateral
    ctf: () => addr("CTF_POLYGON"),
    wsteth: () => addr("WSTETH_POLYGON"),
    universalRouter: () => addr("UNIVERSAL_ROUTER_POLYGON"),
    permit2: () => addr("PERMIT2"),
  },
} as const;
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js + Foundry + typed config"
```

---

## Task 1: Basket registry (types + AI theme + loader)

**Files:**
- Create: `lib/baskets/types.ts`, `lib/baskets/registry.ts`, `test/registry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/registry.test.ts
import { describe, it, expect } from "vitest";
import { getTheme, themeWeightsSumToOne } from "@/lib/baskets/registry";

describe("basket registry", () => {
  it("returns the AI theme with at least one prediction leg and one asset leg", () => {
    const t = getTheme("ai");
    expect(t.slug).toBe("ai");
    expect(t.legs.some(l => l.kind === "prediction")).toBe(true);
    expect(t.legs.some(l => l.kind === "asset")).toBe(true);
  });
  it("weights sum to 1", () => {
    expect(themeWeightsSumToOne("ai")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/registry.test.ts`
Expected: FAIL ("Cannot find module '@/lib/baskets/registry'").

- [ ] **Step 3: Implement types + registry**

```ts
// lib/baskets/types.ts
export type PredictionLeg = {
  kind: "prediction";
  label: string;
  gammaMarketId: string;
  conditionId: `0x${string}`;
  /** The NegRisk QUESTION id — drives NegRiskAdapter.getPositionId(questionId, true/false). */
  questionId: `0x${string}`;
  weight: number;
};
export type AssetLeg = { kind: "asset"; label: string; token: `0x${string}`; weight: number };
export type Leg = PredictionLeg | AssetLeg;
export type Theme = { slug: string; title: string; legs: Leg[] };
```

```ts
// lib/baskets/registry.ts
import type { Theme } from "./types";
const THEMES: Record<string, Theme> = {
  ai: {
    slug: "ai", title: "AI",
    legs: [
      // PRIMARY / always-valid prediction leg (ends 2027-01-01, ~51% YES).
      {
        kind: "prediction",
        label: "OpenAI does NOT IPO by Dec 2026",
        gammaMarketId: "REPLACE_GAMMA_ID_OPENAI",
        conditionId: "0x3849e1d62e0807801913d3e2427e8caf3cc6dd1c8ef42d8d5c08c6f9c449dc5e",
        // questionId for NegRiskAdapter.getPositionId — confirm Day-1 from the Gamma market payload.
        questionId: "0xREPLACE_QUESTION_ID_OPENAI",
        weight: 0.35,
      },
      // SECONDARY / vivid prediction leg (ends 2026-06-30, ~89.5% YES) — great demo number, may resolve soon.
      {
        kind: "prediction",
        label: "Anthropic has the top AI model",
        gammaMarketId: "REPLACE_GAMMA_ID_ANTHROPIC",
        conditionId: "0x0811ed7f71c2466d04f9ba801c0e21c9cfb016385cdff97b5c9984df0fa5801e",
        questionId: "0xREPLACE_QUESTION_ID_ANTHROPIC",
        weight: 0.15,
      },
      { kind: "asset", label: "NVDA-correlated asset leg (wstETH via Sushi)", token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD", weight: 0.5 },
    ],
  },
};
export function getTheme(slug: string): Theme {
  const t = THEMES[slug]; if (!t) throw new Error(`Unknown theme: ${slug}`); return t;
}
export function themeWeightsSumToOne(slug: string): boolean {
  const sum = getTheme(slug).legs.reduce((a, l) => a + l.weight, 0);
  return Math.abs(sum - 1) < 1e-9;
}
```

> conditionIds and the asset token are **pinned/verified** (see VERIFIED FACTS). Only the two `gammaMarketId`s and the two `questionId`s are filled Day-1 from the live Gamma payloads (`docs/04`). The OpenAI-not-IPO leg (ends 2027-01-01) is the PRIMARY always-valid leg; the Anthropic leg (ends 2026-06-30) is the secondary/vivid leg for the demo. The structure and tests are final.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/registry.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/baskets test/registry.test.ts && git commit -m "feat: basket registry with AI theme"
```

---

## Task 2: Divergence engine (the differentiator — pure logic, TDD)

**Files:**
- Create: `lib/divergence/engine.ts`, `test/divergence.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/divergence.test.ts
import { describe, it, expect } from "vitest";
import { assetBandPercentile, divergence } from "@/lib/divergence/engine";

describe("divergence engine", () => {
  it("maps an asset price to its percentile within a published analyst band [low, high]", () => {
    // price 100 in a bear/bull band 50..150 → 0.5 (50th percentile of the band)
    expect(assetBandPercentile(100, 50, 150)).toBeCloseTo(0.5, 6);
    expect(assetBandPercentile(150, 50, 150)).toBeCloseTo(1, 6);
    expect(assetBandPercentile(25, 50, 150)).toBeCloseTo(0, 6); // clamped
  });
  it("computes the signed AI Sentiment Gap = belief - assetBandPercentile, in percentage points", () => {
    const d = divergence(0.72, 0.58);
    expect(d.gapPct).toBeCloseTo(14, 6);
    expect(d.direction).toBe("belief-higher");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/divergence.test.ts` — Expected: FAIL (module missing).

- [ ] **Step 3: Implement the engine**

```ts
// lib/divergence/engine.ts
/** Where the live asset price sits within a PUBLISHED analyst bear/bull band, as a [0,1] percentile.
 *  This is NOT an "implied probability" — it's the asset's position in [low,high] (bear=low, bull=high),
 *  clamped. The band [low,high] are the surfaced bear/bull price targets, shown in the view. */
export function assetBandPercentile(price: number, low: number, high: number): number {
  if (high <= low) throw new Error("high must exceed low");
  return Math.min(1, Math.max(0, (price - low) / (high - low)));
}
export type Divergence = {
  beliefProb: number;
  /** The asset's percentile within the published analyst band (NOT a probability). */
  assetBandPercentile: number;
  /** The "AI Sentiment Gap": belief odds minus the asset's band percentile, in percentage points. */
  gapPct: number;
  direction: "belief-higher" | "asset-higher" | "aligned";
};
export function divergence(beliefProb: number, assetBandPct: number): Divergence {
  const gapPct = (beliefProb - assetBandPct) * 100;
  const direction = Math.abs(gapPct) < 1 ? "aligned" : gapPct > 0 ? "belief-higher" : "asset-higher";
  return { beliefProb, assetBandPercentile: assetBandPct, gapPct: Math.abs(gapPct), direction };
}
```

> **Framing:** the hero metric is the **"AI Sentiment Gap"** (belief-market odds vs where the asset sits in its published analyst band). Never label `assetBandPercentile` an "implied probability" in code, copy, or UI.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/divergence.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/divergence test/divergence.test.ts && git commit -m "feat: divergence engine (AI Sentiment Gap: belief odds vs asset band percentile)"
```

---

## Task 3: Market-data adapters (Polymarket odds + Uniswap price, TDD with mocked fetch)

**Files:**
- Create: `lib/adapters/polymarket.ts`, `lib/adapters/uniswap.ts`, `test/adapters.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/adapters.test.ts
import { describe, it, expect, vi } from "vitest";
import { fetchBeliefProb } from "@/lib/adapters/polymarket";
import { fetchAssetPrice } from "@/lib/adapters/uniswap";

describe("adapters", () => {
  it("parses YES odds from a Gamma market (outcomePrices is a STRINGIFIED JSON array)", async () => {
    // Real Gamma shape: outcomes + outcomePrices are BOTH JSON-encoded strings, not arrays.
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ outcomes: '["Yes","No"]', outcomePrices: '["0.51","0.49"]' }),
    }) as any;
    expect(await fetchBeliefProb("123")).toBeCloseTo(0.51, 6);
  });
  it("parses a USD price from a Uniswap /quote response (q.quote is a STRING amount; needs a swapper)", async () => {
    // Real shape: q.quote is a decimal-string token amount (USDC, 6dp); response carries a `swapper`.
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ quote: "58000000", swapper: "0x0000000000000000000000000000000000000001" }),
    }) as any;
    expect(await fetchAssetPrice("0xToken")).toBeCloseTo(58, 6); // 58000000 / 1e6 -> 58 USDC
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/adapters.test.ts` — Expected: FAIL (modules missing).

- [ ] **Step 3: Implement the adapters**

```ts
// lib/adapters/polymarket.ts
/** Gamma returns `outcomes` and `outcomePrices` as STRINGIFIED JSON arrays — JSON.parse before indexing. */
export async function fetchBeliefProb(gammaMarketId: string): Promise<number> {
  const res = await fetch(`https://gamma-api.polymarket.com/markets/${gammaMarketId}`);
  if (!res.ok) throw new Error(`Gamma ${res.status}`);
  const m = await res.json();
  const outcomes: string[] = JSON.parse(m.outcomes);
  const prices: string[] = JSON.parse(m.outcomePrices);
  const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === "yes");
  return Number(prices[yesIdx >= 0 ? yesIdx : 0]);
}
```

```ts
// lib/adapters/uniswap.ts
import { config } from "@/lib/config";
/** Price of 1 unit of `token` in USDC via the Uniswap Trading API /quote (oracle, not the prize swap).
 *  Real shape: `q.quote` is a STRING token amount (USDC, 6dp) — there is NO q.quote.output.token.decimals.
 *  A valid quote also carries a `swapper`; treat its absence as an error. */
export async function fetchAssetPrice(token: string): Promise<number> {
  const res = await fetch(`${config.uniswap.base()}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": config.uniswap.key() },
    body: JSON.stringify({ type: "EXACT_INPUT", tokenIn: token, tokenOut: config.addrs.usdcNative(), amount: "1000000000000000000", tokenInChainId: 137, tokenOutChainId: 137 }),
  });
  if (!res.ok) throw new Error(`Uniswap quote ${res.status}`);
  const q = await res.json();
  if (!q.swapper) throw new Error("Uniswap quote missing `swapper`");
  // USDC is 6dp; q.quote is the output amount as a decimal string.
  return Number(q.quote) / 1e6;
}
```

> **Day-1:** pin a REAL `/quote` response (capture the actual JSON) and confirm both parses against it. Gamma `outcomes`/`outcomePrices` are JSON-encoded strings; `q.quote` is a string amount with a sibling `swapper` (no nested `output`). Adjust ONLY these parse lines + the mock fixtures if the live shape differs; do not re-introduce `q.quote.output.*`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/adapters.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/adapters test/adapters.test.ts && git commit -m "feat: Polymarket + Uniswap data adapters"
```

---

## Task 4: Dashboard data service (compose adapters + divergence, TDD)

**Files:**
- Create: `lib/dashboard/service.ts`, `test/service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/service.test.ts
import { describe, it, expect, vi } from "vitest";
import * as pm from "@/lib/adapters/polymarket";
import * as us from "@/lib/adapters/uniswap";
import { buildThemeView } from "@/lib/dashboard/service";

describe("buildThemeView", () => {
  it("returns legs + a divergence for the AI theme", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.72);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(58);
    const view = await buildThemeView("ai", { low: 0, high: 100 });
    expect(view.title).toBe("AI");
    expect(view.divergence.gapPct).toBeCloseTo(14, 6); // 0.72 vs 0.58
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/service.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement the service**

```ts
// lib/dashboard/service.ts
import { getTheme } from "@/lib/baskets/registry";
import { fetchBeliefProb } from "@/lib/adapters/polymarket";
import { fetchAssetPrice } from "@/lib/adapters/uniswap";
import { assetBandPercentile, divergence, type Divergence } from "@/lib/divergence/engine";

export type ThemeView = { slug: string; title: string; beliefProb: number; assetPrice: number; divergence: Divergence };
export async function buildThemeView(slug: string, band: { low: number; high: number }): Promise<ThemeView> {
  const t = getTheme(slug);
  // PRIMARY prediction leg (the always-valid OpenAI-not-IPO market) drives the headline odds.
  const pred = t.legs.find(l => l.kind === "prediction")!;
  const asset = t.legs.find(l => l.kind === "asset")!;
  const beliefProb = await fetchBeliefProb((pred as any).gammaMarketId);
  const assetPrice = await fetchAssetPrice((asset as any).token);
  // `band` = published analyst bear/bull targets; this is a percentile, not a probability.
  const assetBandPct = assetBandPercentile(assetPrice, band.low, band.high);
  return { slug: t.slug, title: t.title, beliefProb, assetPrice, divergence: divergence(beliefProb, assetBandPct) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/service.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/dashboard test/service.test.ts && git commit -m "feat: dashboard data service composing divergence"
```

---

## Task 5: Frontend — theme dashboard + divergence panel

**Files:**
- Create: `app/app/api/theme/[slug]/route.ts`, `app/app/theme/[slug]/page.tsx`, `app/components/DivergencePanel.tsx`, `app/components/BasketTable.tsx`

- [ ] **Step 1: API route serving the theme view**

```ts
// app/app/api/theme/[slug]/route.ts
import { NextResponse } from "next/server";
import { buildThemeView } from "@/lib/dashboard/service";
export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const view = await buildThemeView(params.slug, { low: 0, high: 100 });
  return NextResponse.json(view);
}
```

- [ ] **Step 2: Divergence panel component (the hero)**

```tsx
// app/components/DivergencePanel.tsx
export function DivergencePanel({ d }: { d: { beliefProb: number; assetBandPercentile: number; gapPct: number; direction: string } }) {
  return (
    <div className="panel">
      <h2>AI Sentiment Gap</h2>
      <p>Belief markets price <b>{(d.beliefProb * 100).toFixed(0)}%</b></p>
      <p>The asset sits at the <b>{(d.assetBandPercentile * 100).toFixed(0)}th percentile</b> of its analyst bear→bull band</p>
      <p className="gap"><b>{d.gapPct.toFixed(0)}-pt gap</b> ({d.direction})</p>
    </div>
  );
}
```

- [ ] **Step 3: Theme page that fetches + renders + mounts the Enter button**

```tsx
// app/app/theme/[slug]/page.tsx
import { DivergencePanel } from "@/components/DivergencePanel";
async function getView(slug: string) {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/theme/${slug}`, { cache: "no-store" });
  return r.json();
}
export default async function ThemePage({ params }: { params: { slug: string } }) {
  const v = await getView(params.slug);
  return (<main><h1>{v.title} basket</h1><DivergencePanel d={v.divergence} />{/* <EnterButton/> mounted in Task 7 */}</main>);
}
```

- [ ] **Step 4: Run the app and verify the dashboard renders live data**

Run: `cd app && npm run dev` then open `http://localhost:3000/theme/ai`
Expected: the AI dashboard renders belief %, asset %, and the gap.

- [ ] **Step 5: Commit**

```bash
git add app && git commit -m "feat: theme dashboard + divergence panel"
```

---

## Task 6: `EnterBasket` executor contract (Foundry, TDD against a Tenderly Polygon fork)

**Files:**
- Create: `contracts/src/EnterBasket.sol`, `contracts/test/EnterBasket.t.sol`

**Approach:** the prediction leg calls **`NegRiskAdapter.splitPosition(conditionId, amount)`** with **USDC.e** as collateral (the adapter wraps USDC.e → `wcol` internally and mints a NEUTRAL YES+NO outcome set). We then read the two positionIds from **`NegRiskAdapter.getPositionId(questionId, true/false)`** (it takes the **QUESTION id**) and `safeTransferFrom` the ERC1155 outcome tokens to an **explicit `recipient` calldata EOA** (NOT `msg.sender` — when invoked via LI.FI, the immediate caller is the Across executor contract). The asset leg is a Universal Router/Sushi swap (USDC.e→asset) — this is the basket's asset leg, **not** the Uniswap $7k prize swap (that's the standalone Task 6b). Hardening: `ReentrancyGuard`, checks-effects-interactions, exact-amount approvals, NO persistent `setApprovalForAll`, a `getDetermined(marketId)` guard that reverts cleanly on a resolved market, and revert-safety (forward USDC.e to `recipient` on any internal failure). Directional CLOB buys = stretch (see `docs/03`).

- [ ] **Step 1: Write the failing fork test**

```solidity
// contracts/test/EnterBasket.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Test.sol";
import {EnterBasket} from "../src/EnterBasket.sol";
import {IERC20} from "../src/EnterBasket.sol";

interface INegRiskAdapter {
    function getPositionId(bytes32 questionId, bool outcome) external view returns (uint256);
}
interface IERC1155Balance { function balanceOf(address, uint256) external view returns (uint256); }

contract EnterBasketTest is Test {
    EnterBasket basket;
    address USDCE   = vm.envAddress("USDCE_POLYGON");        // collateral
    address ADAPTER = vm.envAddress("NEGRISK_ADAPTER");
    address WCOL    = vm.envAddress("WCOL");
    address CTF     = vm.envAddress("CTF_POLYGON");          // ERC1155 holding outcome tokens
    address user    = address(0xBEEF);                        // the recipient EOA

    function setUp() public {
        vm.createSelectFork(vm.envString("POLYGON_RPC"));    // Tenderly VNet (Polygon 137) admin RPC
        basket = new EnterBasket(USDCE, ADAPTER, CTF);
        deal(USDCE, user, 100e6); // 100 USDC.e
    }

    function test_splitMintsNeutralSetToRecipient() public {
        bytes32 conditionId = vm.envBytes32("AI_CONDITION_ID");
        bytes32 questionId  = vm.envBytes32("AI_QUESTION_ID");
        // Read positionIds the CORRECT way: from the adapter, off the QUESTION id.
        uint256 yesId = INegRiskAdapter(ADAPTER).getPositionId(questionId, true);
        uint256 noId  = INegRiskAdapter(ADAPTER).getPositionId(questionId, false);

        vm.startPrank(user);
        IERC20(USDCE).approve(address(basket), 10e6);
        basket.enterPredictionLeg(conditionId, questionId, 10e6, user); // recipient = user (explicit)
        vm.stopPrank();

        // Non-custodial: the recipient holds BOTH outcome tokens...
        assertGt(IERC1155Balance(CTF).balanceOf(user, yesId), 0, "recipient YES");
        assertGt(IERC1155Balance(CTF).balanceOf(user, noId),  0, "recipient NO");
        // ...and EnterBasket retains NOTHING (no wcol, no USDC.e, no outcome tokens).
        assertEq(IERC20(WCOL).balanceOf(address(basket)),  0, "no wcol left");
        assertEq(IERC20(USDCE).balanceOf(address(basket)), 0, "no USDC.e left");
        assertEq(IERC1155Balance(CTF).balanceOf(address(basket), yesId), 0, "no YES left");
        assertEq(IERC1155Balance(CTF).balanceOf(address(basket), noId),  0, "no NO left");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd contracts && forge test --match-contract EnterBasketTest -vvv`
Expected: FAIL (compile error — `EnterBasket` not implemented).

- [ ] **Step 3: Implement `EnterBasket.sol`**

```solidity
// contracts/src/EnterBasket.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
    function approve(address,uint256) external returns(bool);
    function transfer(address,uint256) external returns(bool);
    function transferFrom(address,address,uint256) external returns(bool);
    function balanceOf(address) external view returns(uint256);
}
interface IERC1155 {
    function safeTransferFrom(address,address,uint256,uint256,bytes calldata) external;
    function balanceOf(address,uint256) external view returns(uint256);
}
interface INegRiskAdapter {
    // The adapter takes USDC.e, wraps it to wcol, and mints a NEUTRAL YES+NO set.
    function splitPosition(bytes32 conditionId, uint256 amount) external;
    // Position ids derive from the QUESTION id (NOT collateral + collectionId).
    function getPositionId(bytes32 questionId, bool outcome) external view returns (uint256);
    // True once a market is resolved/determined — used to fail fast.
    function getDetermined(bytes32 marketId) external view returns (bool);
}

contract EnterBasket is ReentrancyGuard {
    IERC20 public immutable usdce;            // USDC.e collateral
    INegRiskAdapter public immutable adapter; // Polymarket NegRiskAdapter
    IERC1155 public immutable ctf;            // ConditionalTokens (ERC1155 outcome tokens)

    constructor(address _usdce, address _adapter, address _ctf) {
        usdce = IERC20(_usdce);
        adapter = INegRiskAdapter(_adapter);
        ctf = IERC1155(_ctf);
    }

    /// Pull USDC.e from caller, split via the NegRiskAdapter into a NEUTRAL YES+NO set,
    /// then forward BOTH outcome tokens to an explicit `recipient` EOA (non-custodial).
    /// `recipient` is passed in calldata because the immediate caller may be the LI.FI/Across executor.
    function enterPredictionLeg(
        bytes32 conditionId,
        bytes32 questionId,
        uint256 amount,
        address recipient
    ) external nonReentrant {
        require(recipient != address(0), "recipient");
        // Fail fast on a resolved market (clean revert, no funds stranded).
        require(!adapter.getDetermined(_marketId(questionId)), "market resolved");

        // --- effects/interactions: pull collateral ---
        require(usdce.transferFrom(msg.sender, address(this), amount), "transferFrom");

        // Try the split; on ANY internal failure, refund USDC.e to the recipient (revert-safe).
        try this._split(conditionId, amount) {
            // ok
        } catch {
            require(usdce.transfer(recipient, amount), "refund");
            return;
        }

        // Read the two positionIds the CORRECT way: from the adapter, off the QUESTION id.
        uint256 yesId = adapter.getPositionId(questionId, true);
        uint256 noId  = adapter.getPositionId(questionId, false);

        // Forward the full NEUTRAL set to the recipient — keep nothing.
        uint256 yesBal = ctf.balanceOf(address(this), yesId);
        uint256 noBal  = ctf.balanceOf(address(this), noId);
        ctf.safeTransferFrom(address(this), recipient, yesId, yesBal, "");
        ctf.safeTransferFrom(address(this), recipient, noId,  noBal,  "");
    }

    /// Internal split, isolated so the outer try/catch can refund on failure.
    /// Exact-amount approval only; no persistent setApprovalForAll.
    function _split(bytes32 conditionId, uint256 amount) external {
        require(msg.sender == address(this), "internal");
        usdce.approve(address(adapter), amount); // exact amount, just-in-time
        adapter.splitPosition(conditionId, amount);
    }

    /// NegRisk marketId is the question id with its last byte zeroed (one market, many questions).
    function _marketId(bytes32 questionId) internal pure returns (bytes32) {
        return questionId & bytes32(~uint256(0xff));
    }
}
```

- [ ] **Step 3b: Add the asset-leg Universal Router/Sushi swap (NOT the Uniswap prize swap)**

```solidity
// append to EnterBasket.sol — interface + method sketch
interface IUniversalRouter { function execute(bytes calldata commands, bytes[] calldata inputs, uint256 deadline) external payable; }
// enterAssetLeg(amount, recipient, commands, inputs, deadline):
//   pull USDC.e, exact-amount-approve Permit2/router, IUniversalRouter(router).execute(...) with
//   calldata pre-built off-chain (Sushi route — the basket's asset leg). The swap output is delivered
//   to `recipient`. This leg does NOT earn the Uniswap prize; the $7k artifact is the standalone Task 6b.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd contracts && forge test --match-contract EnterBasketTest -vvv`
Expected: PASS — the **recipient** holds both YES and NO outcome tokens AND the `EnterBasket` contract holds ZERO `wcol`/USDC.e/outcome tokens (no false-green USDC-balance assertion).

- [ ] **Step 5: Commit**

```bash
git add contracts && git commit -m "feat: EnterBasket executor (NegRiskAdapter split → recipient, revert-safe)"
```

---

## Task 6b: Standalone Uniswap prize `/swap` (the $7k artifact)

**Files:**
- Create: `lib/uniswap/prizeSwap.ts`, `scripts/runPrizeSwap.ts` (or a tiny CLI)

**Why separate:** the basket's asset leg routes via Sushi and does **not** earn the Uniswap prize. The $7k artifact is a SEPARATE, standalone, REAL on-chain tx executed via the **Uniswap Trading API `/swap`** on **Polygon mainnet (137)** — a tiny USDC↔WETH (or USDC→wstETH) swap. Capture its **tx hash** as THE prize evidence.

- [ ] **Step 1: Build + send the swap via the Trading API `/swap`**

```ts
// lib/uniswap/prizeSwap.ts
import { config } from "@/lib/config";
import { createWalletClient, http, type Address } from "viem";
import { polygon } from "viem/chains";

/** Tiny REAL USDC->wstETH swap on Polygon via the Uniswap Trading API.
 *  Returns the on-chain tx hash — THE $7k prize artifact. x-api-key is mandatory (hard-fail in config). */
export async function runPrizeSwap(account: any, amountUsdc = "1000000" /* 1 USDC, 6dp */): Promise<`0x${string}`> {
  // 1) /quote (oracle) -> 2) /swap (calldata). q.quote is a STRING amount; response carries a `swapper`.
  const headers = { "Content-Type": "application/json", "x-api-key": config.uniswap.key() };
  const swapRes = await fetch(`${config.uniswap.base()}/swap`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "EXACT_INPUT",
      tokenIn: config.addrs.usdcNative(),
      tokenOut: config.addrs.wsteth(),
      amount: amountUsdc,
      tokenInChainId: 137,
      tokenOutChainId: 137,
      swapper: account.address,
    }),
  });
  if (!swapRes.ok) throw new Error(`Uniswap /swap ${swapRes.status}`);
  const { swap } = await swapRes.json(); // { to, data, value } calldata
  const wallet = createWalletClient({ account, chain: polygon, transport: http(config.polygonRpc()) });
  return wallet.sendTransaction({ to: swap.to as Address, data: swap.data, value: BigInt(swap.value ?? 0) });
}
```

- [ ] **Step 2: Run it on Polygon mainnet (tiny, real) and capture the hash**

Run the script with a funded wallet (Permit2 approve USDC for the Universal Router first if needed). Record the **tx hash** — this is the artifact submitted for the **Best Uniswap API Integration ($7k)** prize.

- [ ] **Step 3: Wire it into the app + README**

Surface a "Run Uniswap prize swap" action (or log the hash in the demo), and add the captured tx hash to the README's prize section.

- [ ] **Step 4: Submit the Uniswap Developer Feedback Form** (required for the prize).

- [ ] **Step 5: Commit**

```bash
git add lib/uniswap scripts/runPrizeSwap.ts && git commit -m "feat: standalone Uniswap Trading-API prize swap (real Polygon tx)"
```

---

## Task 7: LI.FI one-signature entry (SDK + Widget)

**Files:**
- Create: `lib/lifi/enter.ts`, `app/components/EnterButton.tsx`

- [ ] **Step 1: Implement the LI.FI route builder (entry → EnterBasket on Polygon)**

```ts
// lib/lifi/enter.ts
import { createConfig, getContractCallsQuote, executeRoute } from "@lifi/sdk";
import { config } from "@/lib/config";
createConfig({ integrator: "project-lynx" });
/** Build a one-signature quote: bridge the user's token to NATIVE USDC on Polygon (137),
 *  then run a destination contract call into EnterBasket. Source chain is Ethereum (1) or Base (8453)
 *  — NEVER Arc (Arc->Polygon routing is dead). The destination call is NOT atomic (see note below). */
export async function buildEnterQuote(params: {
  fromChainId: 1 | 8453;            // Ethereum or Base — never Arc
  fromToken: string;
  fromAddress: string;
  amount: string;                   // EnterBasket input amount on Polygon (native USDC)
  enterBasketCalldata: string;
  enterBasketAddress: string;
  enterBasketGasLimit?: string;
}) {
  // getContractCallsQuote: a TOP-LEVEL `contractCalls` array; each envelope carries its OWN
  // fromAmount + fromTokenAddress (the call's input on the destination chain).
  const quote = await getContractCallsQuote({
    fromChain: params.fromChainId,
    fromToken: params.fromToken,
    fromAddress: params.fromAddress,
    toChain: 137,
    toToken: config.addrs.usdcNative(), // native USDC on Polygon
    contractCalls: [
      {
        fromAmount: params.amount,
        fromTokenAddress: config.addrs.usdcNative(),
        toContractAddress: params.enterBasketAddress,
        toContractCallData: params.enterBasketCalldata,
        toContractGasLimit: params.enterBasketGasLimit ?? "500000",
      },
    ],
  });
  return quote;
}
export { executeRoute };
```

> **Pre-simulate the EXACT calldata on the Tenderly Polygon fork** before relying on it — there is **NO LI.FI pre-sim** (the integrator hits `integrator_not_allowed`), and the destination call is **NOT atomic** with the bridge. `EnterBasket` is revert-safe (refunds USDC.e to `recipient` on internal failure), so a failed destination call leaves the user with their funds, not a stuck state.

- [ ] **Step 2: Wire the Enter button (or drop in the LI.FI Widget) on the theme page**

```tsx
// app/components/EnterButton.tsx — minimal: execute the prebuilt quote on click
"use client";
import { buildEnterQuote, executeRoute } from "@/lib/lifi/enter";
export function EnterButton(props: { fromChainId: 1 | 8453; fromToken: string; fromAddress: string; amount: string; calldata: string; enterBasket: string }) {
  async function onClick() {
    const quote = await buildEnterQuote({ fromChainId: props.fromChainId, fromToken: props.fromToken, fromAddress: props.fromAddress, amount: props.amount, enterBasketCalldata: props.calldata, enterBasketAddress: props.enterBasket });
    await executeRoute(quote as any, { updateRouteHook: (r) => console.log("status", r.steps.map(s => s.execution?.status)) });
  }
  return <button onClick={onClick}>Enter basket (one signature)</button>;
}
```

> Source chain is **Ethereum (1) or Base (8453)** — never Arc. For the polished UI, mount `@lifi/widget` configured with **native USDC on Polygon** as the destination. Because there is no LI.FI pre-sim and the destination call isn't atomic, validate the `EnterBasket` calldata on the Tenderly fork first (Task 6).

- [ ] **Step 3: Manual verification (Tenderly fork → then a tiny real Polygon tx)**

Pre-simulate on the Tenderly Polygon fork (no LI.FI pre-sim is available), then run the app and click Enter with a funded test wallet on Ethereum/Base; confirm in the explorer that native USDC arrives on Polygon and `EnterBasket` executes (both outcome tokens + the asset leg land in the recipient wallet). Record the **tx hashes**. (The Uniswap $7k artifact is the SEPARATE Task 6b swap, not this entry tx.)

- [ ] **Step 4: Commit**

```bash
git add lib/lifi app/components/EnterButton.tsx && git commit -m "feat: LI.FI one-signature basket entry"
```

---

## Task 8: Arc account layer (passkey wallet + USDC balance + USDC-gas + unified NAV)

**Scope:** Arc is the **account/NAV layer ONLY** — Modular Wallet passkey, USDC balance, USDC-paid gas, and a **unified NAV (Arc USDC + Polygon positions)**. **No USYC, no StableFX/EURC.** Arc is never an execution/funding source for entry (LI.FI funds from Ethereum/Base, executes on Polygon).

> **Day-0:** confirm the installed `@circle-fin/modular-wallets-core` version before writing wallet code (the passkey/init API has churned across versions).

**Files:**
- Create: `lib/arc/wallet.ts`, `app/components/AccountBar.tsx`

- [ ] **Step 1: Configure Arc testnet chain + Circle Modular Wallet (passkey)**

```ts
// lib/arc/wallet.ts
import { defineChain } from "viem";
export const arcTestnet = defineChain({
  id: 5042002, name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: [process.env.ARC_TESTNET_RPC!] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
});
// Circle Modular Wallets (passkey) init goes here using CIRCLE_CLIENT_KEY.
// Pin @circle-fin/modular-wallets-core to the version confirmed Day-0 (per Circle docs / Circle MCP snippets).
```

- [ ] **Step 2: AccountBar — show USDC balance on Arc + unified NAV (Arc USDC + Polygon positions)**

```tsx
// app/components/AccountBar.tsx
"use client";
import { useBalance, useAccount } from "wagmi";
// nav = Arc USDC + the value of the Polygon basket legs (outcome tokens + asset leg).
export function AccountBar({ nav }: { nav: number }) {
  const { address } = useAccount();
  const { data } = useBalance({ address, chainId: 5042002 });
  return <div className="account">USDC on Arc: {data?.formatted ?? "—"} · Unified NAV: ${nav.toFixed(2)}</div>;
}
```

- [ ] **Step 3: Manual verification**

Connect via passkey, fund Arc testnet USDC from `https://faucet.circle.com`, confirm balance + unified NAV (Arc USDC + Polygon positions) render; confirm gas is paid in USDC.

- [ ] **Step 4: Commit**

```bash
git add lib/arc app/components/AccountBar.tsx && git commit -m "feat: Arc passkey account + USDC balance + NAV"
```

---

## Task 9: Deliverables & demo polish

**Files:**
- Create: `README.md`, `docs/architecture.md` (diagram), `docs/demo-script.md`

- [ ] **Step 1: Architecture diagram** — add a diagram (Mermaid in `docs/architecture.md`) showing: user → LI.FI (entry from Ethereum/Base → native USDC on Polygon 137) → EnterBasket (NegRiskAdapter split → outcome tokens to recipient + Sushi asset leg) → positions to wallet; data service (Polymarket Gamma + Uniswap /quote → "AI Sentiment Gap"); the standalone Uniswap /swap prize tx; Arc as account/NAV only.
- [ ] **Step 2: README** — what it is, the 3 sponsors + exactly which tool each uses, run instructions, the recorded tx hashes.
- [ ] **Step 3: Demo video** — record the 90s script from `docs/04` (name each sponsor tool on screen).
- [ ] **Step 4: Submit the Uniswap Developer Feedback Form** + ensure public repo + incremental commit history.
- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "docs: architecture, README, demo script, submission deliverables"
```

---

## Self-Review

**Spec coverage:** Dashboard + "AI Sentiment Gap" (Tasks 2–5) ✓ · basket/registry with verified conditionIds (Task 1) ✓ · `EnterBasket` real NegRiskAdapter split → recipient, revert-safe (Task 6) ✓ · standalone Uniswap prize swap (Task 6b) ✓ · LI.FI one-signature entry from Ethereum/Base via `getContractCallsQuote` (Task 7) ✓ · Arc account/USDC/USDC-gas/NAV only (Task 8) ✓ · prize deliverables incl. Uniswap real tx + Developer Feedback Form (Tasks 6b,9) ✓. **Dropped** (USYC, StableFX/EURC, Chainlink); **stretch** (UniswapX exit, multi-theme, agentic) deferred per `docs/01`.

**Placeholder scan:** No "TODO/implement-later" logic gaps. positionIds are read at runtime from **`NegRiskAdapter.getPositionId(questionId, bool)`** (NOT a wrong `ctf.getPositionId(USDC.e, getCollectionId(...))` derivation). The values flagged `REPLACE_*` are just the two `gammaMarketId`s + the two NegRisk `questionId`s — **env/Day-1 config** isolated in the registry (conditionIds, the negRiskMarketID, the four clobTokenIds, and all addresses are already pinned in VERIFIED FACTS). Not logic placeholders.

**No false-greens:** the Task 6 fork test asserts the **recipient** holds BOTH `yesId` and `noId` outcome tokens AND that `EnterBasket` retains **zero** wcol / USDC.e / outcome tokens — the old `assertGt(USDC balance, 0)` green-without-proof assertion is deleted.

**Type consistency:** `Theme`/`Leg` (Task 1, now with `questionId`) used by `buildThemeView` (Task 4); `Divergence` (Task 2, `assetBandPercentile`) returned by `divergence()` and consumed by `DivergencePanel` (Task 5); `EnterBasket.enterPredictionLeg(conditionId, questionId, amount, recipient)` (Task 6) is the target of LI.FI's `getContractCallsQuote` contract call (Task 7). Consistent.

**Known build risks gating tasks:** Task 6/7 depend on Day-1 confirmation of the two `questionId`s/`gammaMarketId`s and a successful Tenderly-fork pre-sim of the EnterBasket calldata. There is **no LI.FI pre-sim** (`integrator_not_allowed`) and the destination call is **not atomic** — mitigated by EnterBasket's revert-safety (refund USDC.e to `recipient`). Arc→Polygon routing is dead (`{connections:[]}`); LI.FI funds from Ethereum (1)/Base (8453) and Arc stays account/NAV-only (this IS Approach B+, the chosen architecture).
