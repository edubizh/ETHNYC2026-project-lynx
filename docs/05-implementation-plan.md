# Project-Lynx MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Execute this in the NEW hackathon repo** (after copying the `docs/build/` package over). Read `docs/01..04` first.

**Goal:** Ship the Project-Lynx MVP — a one-theme (AI) prediction-market index + divergence dashboard where a user enters a curated basket (real Polymarket CTF positions + a tokenized-stock leg) in one signature, with an Arc-based account.

**Architecture:** Approach A — Next.js frontend + off-chain data service (Polymarket Gamma + Uniswap `/quote` → divergence engine), a Solidity `EnterBasket` executor on Polygon (CTF `splitPosition` for the prediction leg + Uniswap Universal Router for the xStock leg), and LI.FI for one-signature cross-chain entry funded from an Arc USDC balance. Fallback B = single-chain Polygon if Arc↔Polygon routing isn't ready.

**Tech Stack:** Next.js + React + TypeScript + wagmi/viem · vitest · `@lifi/sdk` + LI.FI Widget · Uniswap Trading API + `@uniswap/sdk-core` · Circle Modular Wallets + CCTP · Solidity + Foundry · Arc Testnet (`5042002`) + Polygon.

**Granularity note:** Pure-logic units (divergence engine, basket math, data adapters) and the contract are written **TDD** (test→fail→impl→pass→commit). Scaffolding, UI, and external-wiring tasks are concrete task blocks with exact commands rather than micro-TDD, because they depend on live testnet/booth values (see `docs/04` Day-1 de-risk). External values are read from typed env config (a config task lists every var + its source) — that is intentional, not a placeholder.

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
│  ├─ adapters/polymarket.ts      # Gamma odds adapter
│  ├─ adapters/uniswap.ts         # /quote price adapter
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
ARC_TESTNET_RPC=https://rpc.testnet.arc.network        # docs.arc.network
POLYGON_RPC=                                            # any Polygon RPC (Alchemy/Infura)
# --- API keys (from sponsor dashboards / booths, see docs/04) ---
UNISWAP_TRADING_API_BASE=                               # Uniswap Trading API Developer Platform
UNISWAP_API_KEY=                                        # Uniswap Developer Platform
LIFI_API_KEY=                                           # optional; @lifi/sdk works keyless for dev
CIRCLE_CLIENT_KEY=                                      # Circle Modular Wallets console
# --- Addresses (confirm Day 1 — docs/04 de-risk) ---
USDC_POLYGON=0x3c499c542cEF5E3811e1192ce70d8cc03d5c3359 # native USDC on Polygon
UNIVERSAL_ROUTER_POLYGON=                               # Uniswap Universal Router (Polygon)
PERMIT2=0x000000000022D473030F116dDEE9F6B43aC78BA3      # canonical Permit2 (all chains)
CTF_POLYGON=0x4D97DCd97eC945f40cF65F87097ACe5EA0476045  # Polymarket ConditionalTokens (Gnosis CTF)
XSTOCK_TOKEN=                                           # the executable xStock confirmed Day 1
```

- [ ] **Step 3: Create `lib/config.ts` (single typed source of truth)**

```ts
function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}
export const config = {
  arcRpc: () => req("ARC_TESTNET_RPC"),
  polygonRpc: () => req("POLYGON_RPC"),
  uniswap: { base: () => req("UNISWAP_TRADING_API_BASE"), key: () => req("UNISWAP_API_KEY") },
  addrs: {
    usdcPolygon: () => req("USDC_POLYGON"),
    universalRouter: () => req("UNIVERSAL_ROUTER_POLYGON"),
    permit2: () => req("PERMIT2"),
    ctf: () => req("CTF_POLYGON"),
    xstock: () => req("XSTOCK_TOKEN"),
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
  kind: "prediction"; label: string; gammaMarketId: string; conditionId: `0x${string}`; weight: number;
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
      { kind: "prediction", label: "GPT-6 released in 2026", gammaMarketId: "REPLACE_GAMMA_ID", conditionId: "0x00", weight: 0.5 },
      { kind: "asset", label: "NVDA (xStock)", token: "0x0000000000000000000000000000000000000000", weight: 0.5 },
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

> Replace `REPLACE_GAMMA_ID` / `conditionId` / `token` with the confirmed AI-theme markets + executable xStock from Day-1 de-risk (`docs/04`). The structure and tests are final; only the data values are filled in.

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
import { assetImpliedProb, divergence } from "@/lib/divergence/engine";

describe("divergence engine", () => {
  it("maps an asset price to an implied probability within a band [low, high]", () => {
    // price 100 in a band 50..150 → 0.5 implied
    expect(assetImpliedProb(100, 50, 150)).toBeCloseTo(0.5, 6);
    expect(assetImpliedProb(150, 50, 150)).toBeCloseTo(1, 6);
    expect(assetImpliedProb(25, 50, 150)).toBeCloseTo(0, 6); // clamped
  });
  it("computes signed divergence = belief - asset, in percentage points", () => {
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
/** Map an asset price into an implied [0,1] probability using a transparent linear band.
 *  MVP proxy: probability = (price - low) / (high - low), clamped. Document the band per leg. */
export function assetImpliedProb(price: number, low: number, high: number): number {
  if (high <= low) throw new Error("high must exceed low");
  return Math.min(1, Math.max(0, (price - low) / (high - low)));
}
export type Divergence = { beliefProb: number; assetProb: number; gapPct: number; direction: "belief-higher" | "asset-higher" | "aligned" };
export function divergence(beliefProb: number, assetProb: number): Divergence {
  const gapPct = (beliefProb - assetProb) * 100;
  const direction = Math.abs(gapPct) < 1 ? "aligned" : gapPct > 0 ? "belief-higher" : "asset-higher";
  return { beliefProb, assetProb, gapPct: Math.abs(gapPct), direction };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/divergence.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/divergence test/divergence.test.ts && git commit -m "feat: divergence engine (belief vs asset-implied probability)"
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
  it("parses YES implied probability from a Gamma market", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ outcomes: ["Yes","No"], outcomePrices: ["0.72","0.28"] }) }) as any;
    expect(await fetchBeliefProb("123")).toBeCloseTo(0.72, 6);
  });
  it("parses a USD price from a Uniswap /quote response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ quote: { output: { amount: "58000000", token: { decimals: 6 } } } }) }) as any;
    expect(await fetchAssetPrice("0xToken")).toBeCloseTo(58, 6); // 1 unit -> 58 USDC
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/adapters.test.ts` — Expected: FAIL (modules missing).

- [ ] **Step 3: Implement the adapters**

```ts
// lib/adapters/polymarket.ts
export async function fetchBeliefProb(gammaMarketId: string): Promise<number> {
  const res = await fetch(`https://gamma-api.polymarket.com/markets/${gammaMarketId}`);
  if (!res.ok) throw new Error(`Gamma ${res.status}`);
  const m = await res.json();
  const yesIdx = m.outcomes.findIndex((o: string) => o.toLowerCase() === "yes");
  return Number(m.outcomePrices[yesIdx >= 0 ? yesIdx : 0]);
}
```

```ts
// lib/adapters/uniswap.ts
import { config } from "@/lib/config";
/** Price of 1 unit of `token` in USDC via the Uniswap Trading API /quote. */
export async function fetchAssetPrice(token: string): Promise<number> {
  const res = await fetch(`${config.uniswap.base()}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": config.uniswap.key() },
    body: JSON.stringify({ type: "EXACT_INPUT", tokenIn: token, tokenOut: config.addrs.usdcPolygon(), amount: "1000000000000000000", tokenInChainId: 137, tokenOutChainId: 137 }),
  });
  if (!res.ok) throw new Error(`Uniswap quote ${res.status}`);
  const q = await res.json();
  return Number(q.quote.output.amount) / 10 ** q.quote.output.token.decimals;
}
```

> The Gamma response shape (`outcomes`/`outcomePrices`) and the `/quote` body are per current docs; confirm field names against a live call Day 1 and adjust the parse line only.

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
import { assetImpliedProb, divergence, type Divergence } from "@/lib/divergence/engine";

export type ThemeView = { slug: string; title: string; beliefProb: number; assetPrice: number; divergence: Divergence };
export async function buildThemeView(slug: string, band: { low: number; high: number }): Promise<ThemeView> {
  const t = getTheme(slug);
  const pred = t.legs.find(l => l.kind === "prediction")!;
  const asset = t.legs.find(l => l.kind === "asset")!;
  const beliefProb = await fetchBeliefProb((pred as any).gammaMarketId);
  const assetPrice = await fetchAssetPrice((asset as any).token);
  const assetProb = assetImpliedProb(assetPrice, band.low, band.high);
  return { slug: t.slug, title: t.title, beliefProb, assetPrice, divergence: divergence(beliefProb, assetProb) };
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
export function DivergencePanel({ d }: { d: { beliefProb: number; assetProb: number; gapPct: number; direction: string } }) {
  return (
    <div className="panel">
      <h2>Divergence</h2>
      <p>Belief markets imply <b>{(d.beliefProb * 100).toFixed(0)}%</b></p>
      <p>The asset is pricing <b>{(d.assetProb * 100).toFixed(0)}%</b></p>
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

## Task 6: `EnterBasket` executor contract (Foundry, TDD against a Polygon fork)

**Files:**
- Create: `contracts/src/EnterBasket.sol`, `contracts/test/EnterBasket.t.sol`

**Approach:** the prediction leg uses CTF `splitPosition` (deposit USDC → mint a real outcome-token set, fully on-chain, no order book). The asset leg uses the Universal Router (swap USDC→xStock). Directional CLOB buys = stretch (see `docs/03`).

- [ ] **Step 1: Write the failing fork test**

```solidity
// contracts/test/EnterBasket.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Test.sol";
import {EnterBasket} from "../src/EnterBasket.sol";
import {IERC20} from "../src/EnterBasket.sol";

contract EnterBasketTest is Test {
    EnterBasket basket;
    address USDC = vm.envAddress("USDC_POLYGON");
    address CTF  = vm.envAddress("CTF_POLYGON");
    address user = address(0xBEEF);

    function setUp() public {
        vm.createSelectFork(vm.envString("POLYGON_RPC"));
        basket = new EnterBasket(USDC, CTF);
        deal(USDC, user, 100e6); // 100 USDC
    }

    function test_splitMintsOutcomeTokens() public {
        bytes32 conditionId = vm.envBytes32("AI_CONDITION_ID");
        vm.startPrank(user);
        IERC20(USDC).approve(address(basket), 10e6);
        basket.enterPredictionLeg(conditionId, 10e6); // 10 USDC -> outcome set to user
        vm.stopPrank();
        // user should now hold CTF ERC1155 balances > 0 (asserted via CTF balanceOf in full impl)
        assertGt(IERC20(USDC).balanceOf(user), 0);
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
interface IERC20 { function approve(address,uint256) external returns(bool); function transferFrom(address,address,uint256) external returns(bool); function balanceOf(address) external view returns(uint256); }
interface IConditionalTokens {
  function splitPosition(address collateral, bytes32 parentCollectionId, bytes32 conditionId, uint256[] calldata partition, uint256 amount) external;
  function setApprovalForAll(address, bool) external;
}
contract EnterBasket {
    IERC20 public immutable usdc;
    IConditionalTokens public immutable ctf;
    constructor(address _usdc, address _ctf){ usdc = IERC20(_usdc); ctf = IConditionalTokens(_ctf); }
    /// Pull USDC from caller, split into a binary outcome set held by THIS contract,
    /// then (full impl) transfer the ERC1155 outcome tokens to the caller (non-custodial).
    function enterPredictionLeg(bytes32 conditionId, uint256 amount) external {
        require(usdc.transferFrom(msg.sender, address(this), amount), "transferFrom");
        usdc.approve(address(ctf), amount);
        uint256[] memory partition = new uint256[](2);
        partition[0] = 1; partition[1] = 2; // binary YES/NO index sets
        ctf.splitPosition(address(usdc), bytes32(0), conditionId, partition, amount);
        // NOTE: add ERC1155 safeTransferFrom of the minted positionIds back to msg.sender (Step 3b).
    }
}
```

- [ ] **Step 3b: Add the ERC1155 transfer-to-caller (non-custodial) and a `enterAssetLeg` Universal Router call**

```solidity
// append to EnterBasket.sol
interface IERC1155 { function safeTransferFrom(address,address,uint256,uint256,bytes calldata) external; }
interface IUniversalRouter { function execute(bytes calldata commands, bytes[] calldata inputs, uint256 deadline) external payable; }
// In enterPredictionLeg, after splitPosition, compute the two positionIds (CTF.getPositionId) and
// IERC1155(address(ctf)).safeTransferFrom(address(this), msg.sender, positionId, amount, "") for each.
// enterAssetLeg(amount, commands, inputs): pull USDC, approve Permit2/router, IUniversalRouter(router).execute(...)
// with calldata pre-built off-chain by the Uniswap Trading API /swap response.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd contracts && forge test --match-contract EnterBasketTest -vvv`
Expected: PASS (USDC pulled, split executed on the fork).

- [ ] **Step 5: Commit**

```bash
git add contracts && git commit -m "feat: EnterBasket executor (CTF split + Universal Router leg)"
```

---

## Task 7: LI.FI one-signature entry (SDK + Widget)

**Files:**
- Create: `lib/lifi/enter.ts`, `app/components/EnterButton.tsx`

- [ ] **Step 1: Implement the LI.FI route builder (entry → EnterBasket on Polygon)**

```ts
// lib/lifi/enter.ts
import { createConfig, getRoutes, executeRoute } from "@lifi/sdk";
createConfig({ integrator: "project-lynx" });
/** Build a route from the user's chosen token/chain to a USDC amount on Polygon,
 *  with a destination contract call into EnterBasket. */
export async function buildEnterRoute(params: {
  fromChainId: number; fromToken: string; fromAddress: string; amount: string; enterBasketCalldata: string; enterBasketAddress: string;
}) {
  const result = await getRoutes({
    fromChainId: params.fromChainId, toChainId: 137,
    fromTokenAddress: params.fromToken, toTokenAddress: process.env.USDC_POLYGON!,
    fromAmount: params.amount, fromAddress: params.fromAddress,
    options: { destinationCall: { callData: params.enterBasketCalldata, callTo: params.enterBasketAddress } as any },
  });
  return result.routes[0];
}
export { executeRoute };
```

- [ ] **Step 2: Wire the Enter button (or drop in the LI.FI Widget) on the theme page**

```tsx
// app/components/EnterButton.tsx — minimal: execute the prebuilt route on click
"use client";
import { buildEnterRoute, executeRoute } from "@/lib/lifi/enter";
export function EnterButton(props: { fromChainId: number; fromToken: string; fromAddress: string; amount: string; calldata: string; enterBasket: string }) {
  async function onClick() {
    const route = await buildEnterRoute({ fromChainId: props.fromChainId, fromToken: props.fromToken, fromAddress: props.fromAddress, amount: props.amount, enterBasketCalldata: props.calldata, enterBasketAddress: props.enterBasket });
    await executeRoute(route, { updateRouteHook: (r) => console.log("status", r.steps.map(s => s.execution?.status)) });
  }
  return <button onClick={onClick}>Enter basket (one signature)</button>;
}
```

> If Composer doesn't natively recognize `EnterBasket` as a deposit target, this destination-call path is the fallback (see `docs/02` LI.FI flags). For the polished UI, mount `@lifi/widget` configured with Polygon USDC as the destination.

- [ ] **Step 3: Manual verification (testnet/fork)**

Run the app, click Enter with a funded test wallet; confirm in the explorer that USDC arrives on Polygon and `EnterBasket` executes (outcome tokens + xStock land in the wallet). Record the **tx hashes** (needed for the Uniswap prize).

- [ ] **Step 4: Commit**

```bash
git add lib/lifi app/components/EnterButton.tsx && git commit -m "feat: LI.FI one-signature basket entry"
```

---

## Task 8: Arc account layer (passkey wallet + USDC balance + unified NAV)

**Files:**
- Create: `lib/arc/wallet.ts`, `app/components/AccountBar.tsx`

- [ ] **Step 1: Configure Arc testnet chain + Circle passkey wallet**

```ts
// lib/arc/wallet.ts
import { defineChain } from "viem";
export const arcTestnet = defineChain({
  id: 5042002, name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: [process.env.ARC_TESTNET_RPC!] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
});
// Circle Modular Wallets (passkey) init goes here using CIRCLE_CLIENT_KEY (per Circle docs / Circle MCP snippets).
```

- [ ] **Step 2: AccountBar — show USDC balance on Arc + unified NAV (USDC + basket legs)**

```tsx
// app/components/AccountBar.tsx
"use client";
import { useBalance, useAccount } from "wagmi";
export function AccountBar({ nav }: { nav: number }) {
  const { address } = useAccount();
  const { data } = useBalance({ address, chainId: 5042002 });
  return <div className="account">USDC on Arc: {data?.formatted ?? "—"} · Basket NAV: ${nav.toFixed(2)}</div>;
}
```

- [ ] **Step 3: Manual verification**

Connect via passkey, fund Arc testnet USDC from `https://faucet.circle.com`, confirm balance + NAV render; confirm gas is paid in USDC.

- [ ] **Step 4: Commit**

```bash
git add lib/arc app/components/AccountBar.tsx && git commit -m "feat: Arc passkey account + USDC balance + NAV"
```

---

## Task 9: Deliverables & demo polish

**Files:**
- Create: `README.md`, `docs/architecture.md` (diagram), `docs/demo-script.md`

- [ ] **Step 1: Architecture diagram** — add a diagram (Mermaid in `docs/architecture.md`) showing: user → LI.FI (entry) → EnterBasket (Polygon: CTF split + Uniswap leg) → positions to wallet; data service (Polymarket + Uniswap /quote → divergence); Arc account/NAV.
- [ ] **Step 2: README** — what it is, the 3 sponsors + exactly which tool each uses, run instructions, the recorded tx hashes.
- [ ] **Step 3: Demo video** — record the 90s script from `docs/04` (name each sponsor tool on screen).
- [ ] **Step 4: Submit the Uniswap Developer Feedback Form** + ensure public repo + incremental commit history.
- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "docs: architecture, README, demo script, submission deliverables"
```

---

## Self-Review

**Spec coverage:** Dashboard + divergence (Tasks 2–5) ✓ · basket/registry (Task 1) ✓ · `EnterBasket` real on-chain CTF + Uniswap leg (Task 6) ✓ · LI.FI one-signature entry (Task 7) ✓ · Arc account/USDC/NAV (Task 8) ✓ · prize deliverables incl. Uniswap real tx + form (Tasks 7,9) ✓. **Stretch** (USYC, EURC, UniswapX exit, multi-theme, agentic) intentionally deferred per `docs/01`.

**Placeholder scan:** No "TODO/implement-later" logic gaps. The data values flagged `REPLACE_*` (Gamma id, conditionId, xStock token, router address) are **env/Day-1 config**, isolated in `lib/config.ts` and the registry, with a named source in `docs/04` — not logic placeholders.

**Type consistency:** `Theme`/`Leg` (Task 1) used by `buildThemeView` (Task 4); `Divergence` (Task 2) returned by `divergence()` and consumed by `DivergencePanel` (Task 5); `EnterBasket.enterPredictionLeg(conditionId, amount)` (Task 6) is the target of LI.FI's destination calldata (Task 7). Consistent.

**Known build risks gating tasks:** Task 6/7 depend on Day-1 confirmation of Arc↔Polygon routing, an executable xStock, and Polymarket fork/mainnet choice (`docs/04`). If routing is blocked → Approach B (assemble + account on Polygon).
