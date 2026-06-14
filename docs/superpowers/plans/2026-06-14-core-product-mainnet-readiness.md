# Core-Product Mainnet-Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Build ONLY the tasks in this plan** — other worktrees own other features (see the Overlap Fence). Commit after every task; keep the suite green.

**Goal:** Make the **core product** — the data/dashboard area and the one-signature buy flow (a Polymarket NegRisk neutral YES+NO set + an on-chain asset sleeve) — work **100% on Polygon mainnet with real money** for a live demo, and **100% qualify for all 3 sponsors** (Arc, LI.FI, Uniswap).

**Architecture (locked — "Approach B+"):** Polygon mainnet `137` is the execution chain (real txs, real money). One **LI.FI Composer** signature swaps native USDC → USDC.e and fans the deposit across `EnterBasket.enterPredictionLeg` × N (permissionless `NegRiskAdapter.splitPosition` neutral set) + `EnterBasket.enterAssetLeg` × M (Uniswap `SwapRouter02` sleeve) into the **user's own wallet** (non-custodial). **Arc Testnet** `5042002` is the account/NAV layer (Circle Modular Wallet passkey + a real USDC-gas userOp). **Uniswap** Trading API powers the `/quote` price oracle, the per-leg `minAmountOut` floor, and the standalone `$7k` `/swap` artifact. Same-chain Polygon is the only real-money entry spine; cross-chain (Ethereum/Base) is a disabled stretch.

**Tech Stack:** Next.js (App Router, server + `"use client"`) · TypeScript · viem/wagmi · `@lifi/sdk` · Uniswap Trading API + `SwapRouter02` · `@circle-fin/modular-wallets-core` (Arc) · Foundry (contracts) · vitest. Current baseline (HEAD `d485c9c`): **93/93 vitest · tsc clean · `next build` green (6 routes) · 7/7 Foundry fork tests.**

---

## Mainnet & real-money matrix (read before building — one honest boundary to acknowledge)

| Surface | Network | Real money? | Status |
|---|---|---|---|
| Basket entry (LI.FI Composer → EnterBasket → NegRisk set + Uniswap sleeve) | **Polygon mainnet 137** | **Yes — real USDC** | Core spine. Hardened by Part B; executed live in Part C. |
| Uniswap standalone `/swap` ($7k artifact) | **Polygon mainnet 137** | **Yes** (already executed: `0x23a0…cbde`) | Done on-chain; the prize is gated on a **form** (Task C2). |
| Arc account + USDC-gas userOp | **Arc Testnet 5042002** | **Testnet** (by necessity) | See note ↓. |
| Cross-chain entry (Ethereum/Base → Polygon) | ETH/Base mainnet | n/a | **Disabled** — broken-by-construction (Task B5); fix is STRETCH only. |

> **Acknowledge re: "all mainnets":** Arc participates via **Arc *Testnet*** — there is no Arc mainnet in Circle's current program, and CCTP cannot bridge testnet value to Polygon **mainnet**. This is the locked, defensible design: Arc is the **account/NAV layer** with a *real on-chain Arc-Testnet* USDC-gas userOp, decoupled from the mainnet execution. Every basket entry that moves **real money is on Polygon mainnet**. If you truly need a mainnet-money flow *originating* on Ethereum/Base, that is the cross-chain STRETCH (Task B5-stretch) and must be fixed before it can be demoed.

---

## Scope & Overlap Fence (other worktrees are active — stay in this lane)

**This plan OWNS and may edit only these files:**
`lib/divergence/engine.ts` · `lib/baskets/registry.ts` · `lib/baskets/types.ts` · `lib/dashboard/service.ts` · `lib/adapters/polymarket.ts` · `lib/adapters/uniswap.ts` · `lib/lifi/assetQuotes.ts` · `lib/lifi/enter.ts` · `lib/lifi/entryPlan.ts` · `lib/lifi/basketEntry.ts` · `lib/config.ts` · `app/api/basket-entry/route.ts` · `app/theme/[slug]/page.tsx` · `components/EnterSheet.tsx` · `components/BuyBox.tsx` · `.env.example` · the matching `test/*.test.ts` files. Contracts are **reused, not redeployed**.

**Do NOT touch (other worktrees own these):** `components/terminal/**` · `lib/live/**` · `app/api/feeds/**` · `app/theme/[slug]/layout.tsx` · `design/**` · `DESIGN.md` · `PRODUCT.md` · `app/page.tsx` (Browse) and `components/Browse.tsx` unless a task explicitly says so (none do). If a task here ever appears to require editing a fenced file, **stop and coordinate** rather than overwrite.

**Out of scope (captured elsewhere, not built here):** the terminal subsystem, the broad doc reconciliation, monochrome cosmetic cleanup of dead `globals.css` tokens, UniswapX exit, Circle Gateway, on-chain ERC-1155 NAV, the LI.FI route-graph/animation polish. These do not block "100% mainnet + real money + 3 sponsors."

---

## Product decisions baked into this plan (already decided — noted for transparency)

1. **Hero framing = honest labeled divergence, NOT a fabricated polarity flip.** The AI primary belief leg is *"Will OpenAI not IPO by Dec 31 2026?"* @ ~51.5% — verified live, resolution-safe (ends 2027-01-01). "OpenAI staying private" is **not** a clean "AI-bullish" axis, so we do **not** invent an `expectedSign` transform (that would be arbitrary and indefensible). Instead the hero is branded **"AI Sentiment Gap"** and gets a **precise subtitle naming the exact market + band**, framed as an *attention/divergence indicator* (Task A1). This is the most honest, judge-proof answer.
2. **Hero anchor stays OpenAI-not-IPO** (resolution-safe). The vivid Anthropic leg (~89.5%) **resolves 2026-06-30** — inside/just after the judging window — so it must never anchor the hero, and the dashboard must degrade gracefully if it resolves (Task A4).
3. **Same-chain Polygon is the real-money spine.** Cross-chain stays disabled (Task B5).

---

## File Structure (what each touched file is responsible for)

- `lib/divergence/engine.ts` — pure gap math (unchanged behavior; only a doc comment clarifying it is a divergence indicator, not a probability).
- `lib/dashboard/service.ts` — adds `hero.beliefLabel` so the page can render an honest subtitle; no math change.
- `lib/baskets/registry.ts` — coherent fallback band + seed for AI (no saturation in offline mode).
- `lib/adapters/polymarket.ts` — `fetchBeliefProb` gains a closed/resolved guard so a resolved market degrades to the seed instead of showing a fake live 0%/100%.
- `lib/adapters/uniswap.ts` / `lib/lifi/assetQuotes.ts` — minOut floor: precision-safe scaling + documented USDC.e≈$1 assumption; covered for WBTC (8dp).
- `lib/config.ts` — `server-only` guard hardening the Uniswap-key boundary.
- `lib/lifi/enter.ts` — optional LI.FI API key on `createConfig` for live-demo reliability.
- `lib/lifi/entryPlan.ts` — comment hardening the cross-chain-disabled posture (no behavior change; it already returns `{supported:false}` for 1/8453 unless the flag is on).
- `app/api/basket-entry/route.ts` — unchanged code; gains a real test suite.
- `app/theme/[slug]/page.tsx` — hero rename + subtitle; honest asset-leg source badge.
- `components/EnterSheet.tsx` — Uniswap evidence hash from env (provably tied to the real swap).
- `.env.example` — document the new optional env vars.

---

# PART A — Data / Dashboard: make the hero real, honest, and mainnet-accurate

### Task A1: Brand the hero "AI Sentiment Gap" + honest subtitle (kills the "what does this number mean?" question)

**Files:**
- Modify: `lib/dashboard/service.ts` (add `beliefLabel` to the `hero` type + value)
- Modify: `app/theme/[slug]/page.tsx:118` (rename + subtitle)
- Modify: `lib/divergence/engine.ts` (doc comment only)
- Test: `test/dashboard.test.ts`

- [ ] **Step 1: Write the failing test** — add to `test/dashboard.test.ts` inside `describe("buildDashboard", …)`:

```typescript
  it("exposes the PRIMARY belief market label for the honest hero subtitle", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.515);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4300);
    vi.spyOn(eq, "fetchEquityPrice").mockResolvedValue(205);

    const d = await buildDashboard("ai");
    expect(d.hero.beliefLabel).toBe("OpenAI does NOT IPO by Dec 2026");
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run test/dashboard.test.ts`
Expected: FAIL — `d.hero.beliefLabel` is `undefined` (property does not exist).

- [ ] **Step 3: Add `beliefLabel` to the hero type + value** in `lib/dashboard/service.ts`.

In the `DashboardView` type, add `beliefLabel: string;` to the `hero` object (after `beliefSource: Source;`):

```typescript
  hero: {
    beliefProb: number;
    beliefSource: Source;
    beliefLabel: string;
    assetSymbol: string;
```

In the `return` of `buildDashboard`, add `beliefLabel` to the `hero` object (after `beliefSource: primary.beliefSource!,`):

```typescript
      beliefProb: primary.beliefProb!,
      beliefSource: primary.beliefSource!,
      beliefLabel: primary.label,
      assetSymbol: headline.ticker,
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/dashboard.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Rename the hero + add the honest subtitle** in `app/theme/[slug]/page.tsx`.

Replace the hero `<h2>` (line ~118):

```tsx
            <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 20, color: "#FFFFFF" }}>AI Sentiment Gap</h2>
```

Then, immediately AFTER the closing `</div>` of the header flex row (the `<div>` that holds the `<h2>` and the gap chip, ends just before `<div style={{ position: "relative", height: 56 …`), insert a subtitle paragraph:

```tsx
          <p style={{ margin: "-22px 0 26px", maxWidth: 620, fontSize: 13, lineHeight: 1.55, color: "#7A828D" }}>
            Belief markets price <span style={{ color: "#A6B2C2" }}>“{h.beliefLabel}”</span> at <span style={{ color: "#A6B2C2", fontFamily: MONO }}>{belief}%</span>; {h.assetSymbol} sits at the <span style={{ color: "#E8EBEF", fontFamily: MONO }}>{pct}th</span> percentile of its published analyst band (${fmt(h.band.low)}–${fmt(h.band.high)}). The gap is a divergence signal between crowd belief and analyst valuation — not a probability or trade recommendation.
          </p>
```

- [ ] **Step 6: Add the clarifying doc comment** to `lib/divergence/engine.ts` — replace the `gapPct` field comment in the `Divergence` type:

```typescript
  /** The "AI Sentiment Gap": the unsigned distance (percentage points) between belief-market odds and the
   *  asset's analyst-band percentile. A DIVERGENCE/attention indicator — NOT a probability, edge, or advice. */
  gapPct: number;
```

- [ ] **Step 7: Verify the page renders + suite green**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS (94 tests) + clean. Then `npm run dev` and load `http://localhost:3000/theme/ai` — confirm the hero reads "AI Sentiment Gap" with the subtitle naming the OpenAI market + band.

- [ ] **Step 8: Commit**

```bash
git add lib/dashboard/service.ts app/theme/[slug]/page.tsx lib/divergence/engine.ts test/dashboard.test.ts
git commit -m "feat(dashboard): brand hero 'AI Sentiment Gap' + honest divergence subtitle

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task A2: Coherent fallback band + seed for AI (no hero saturation in offline mode)

**Context:** When the equity price is **live**, the hero already uses the live Yahoo analyst band (`service.ts:164-166`), so it is self-consistent. The bug is only in **fallback** mode: the hardcoded `AI_BAND = {105, 305}` + `fallback.equityPrice = 165` can drift from reality and, if the seed price ever exceeds the band, saturate the percentile at 100%. This task makes the fallback internally coherent and adds an invariant test so it can never silently saturate again.

**Files:**
- Modify: `lib/baskets/registry.ts` (the `AI_BAND` constant + AI `fallback`)
- Test: `test/registry.test.ts`

- [ ] **Step 1: Write the failing test** — add to `test/registry.test.ts` (top imports already include `getTheme`; if not, add `import { getTheme } from "@/lib/baskets/registry";`):

```typescript
  it("AI fallback seed price sits strictly inside the fallback band (never saturates the hero)", () => {
    const ai = getTheme("ai");
    const { low, high } = ai.display.analystBand;
    const seed = ai.display.fallback.equityPrice;
    expect(seed).toBeGreaterThan(low);
    expect(seed).toBeLessThan(high);
    // and not pinned to an edge: at least 15% in from either bound
    const pct = (seed - low) / (high - low);
    expect(pct).toBeGreaterThan(0.15);
    expect(pct).toBeLessThan(0.85);
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run test/registry.test.ts`
Expected: FAIL — with `AI_BAND {105,305}` + seed `165`, percentile = `(165-105)/200 = 0.30` (passes the bounds but **confirm**); if it already passes, instead assert the band is current by tightening to the values set in Step 3. (The seed `165` vs band `{105,305}` is internally coherent but **stale** vs a mid-2026 NVDA ~ $200+, so refresh in Step 3 regardless.)

- [ ] **Step 3: Refresh the fallback band + seed** in `lib/baskets/registry.ts`. Update the `AI_BAND` constant and the AI `display.fallback`:

```typescript
// Illustrative published analyst bear/bull band for NVDA, shared by display.analystBand and the NVDA
// security so they never drift. FALLBACK ONLY — when the equity price is live, the hero uses the live
// Yahoo target band (service.ts). Keep the seed strictly mid-band so the offline hero never saturates.
// CONFIRM the numbers against live Yahoo targets at demo time (fetchAnalystBand('NVDA')).
const AI_BAND: { low: number; high: number } = { low: 160, high: 360 };
```

And in the AI theme's `display.fallback`:

```typescript
      fallback: { beliefProb: 0.515, equityPrice: 245, assetLegPriceUsd: 4300 },
```

(245 sits at the 42nd percentile of 160–360 — mid-band; `beliefProb` 0.515 matches the verified live OpenAI YES odds.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/registry.test.ts test/dashboard.test.ts`
Expected: PASS. (The `dashboard.test.ts` "fallback" case asserts `equityPrice` — update that expectation: the case at `test/dashboard.test.ts` "falls back to VERIFIED seeds" expects `d.hero.equityPrice` to be `165`; change it to `245`.)

- [ ] **Step 5: Update the dependent dashboard fallback assertion** in `test/dashboard.test.ts`:

```typescript
    expect(d.hero.equityPrice).toBe(245);
```

- [ ] **Step 6: Run both suites green**

Run: `npx vitest run test/registry.test.ts test/dashboard.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/baskets/registry.ts test/registry.test.ts test/dashboard.test.ts
git commit -m "fix(dashboard): coherent AI fallback band+seed so the offline hero never saturates

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task A3: Honest asset-leg source badge (bind to `leg.priceSource`, stop hardcoding "live · uniswap")

**Context:** The prediction-leg cards already honestly switch between "live · Polymarket" and "fallback · cached" (`page.tsx:206-214`), but the asset-leg card hardcodes `◆ live · uniswap (Polygon)` (`page.tsx:243-245`) and never reads `leg.priceSource` — so on a degraded `/quote` a seeded price still claims "live". A judge who kills a feed catches this.

**Files:**
- Modify: `app/theme/[slug]/page.tsx:243-245`

- [ ] **Step 1: Replace the hardcoded asset-leg source line** in `app/theme/[slug]/page.tsx`. Find:

```tsx
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 11, color: "#E8EBEF" }}>
                    <span>◆</span>live · uniswap <span style={{ color: "#7A828D" }}>(Polygon)</span>
                  </span>
```

Replace with:

```tsx
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 11, color: leg.priceSource === "fallback" ? "#7A828D" : "#E8EBEF" }}>
                    {leg.priceSource === "fallback" ? (
                      <><span style={{ color: "#7A828D" }}>○</span>fallback · cached</>
                    ) : (
                      <><span>◆</span>live · uniswap <span style={{ color: "#7A828D" }}>(Polygon)</span></>
                    )}
                  </span>
```

- [ ] **Step 2: Verify build + typecheck**

Run: `npx tsc --noEmit && npm run build`
Expected: clean + green. (`leg.priceSource` is already on `LegView`.) Optionally `npm run dev` and confirm the asset card shows "live · uniswap" normally and "fallback · cached" when the Uniswap key/feed is removed.

- [ ] **Step 3: Commit**

```bash
git add app/theme/[slug]/page.tsx
git commit -m "fix(dashboard): asset-leg badge reflects real priceSource (no fake 'live' on a seed)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task A4: Resolved/closed-market guard on the belief feed (so a resolved market degrades, never shows a fake live 0%/100%)

**Context:** `fetchBeliefProb` reads only `outcomes`/`outcomePrices` and ignores Gamma's `closed`/`active` flags. The Anthropic leg **resolves 2026-06-30** (verified live) — inside/near the judging window. On resolution Gamma returns prices like `["1","0"]` with `closed:true`; today the dashboard would render `100% · live`. This guard makes a closed market **throw**, so `withFallback` (`service.ts:46`) degrades it to the verified seed tagged `fallback` — honest and non-breaking.

**Files:**
- Modify: `lib/adapters/polymarket.ts` (`fetchBeliefProb`)
- Test: `test/adapters.test.ts`

- [ ] **Step 1: Write the failing test** — add to `test/adapters.test.ts` inside `describe("Polymarket Gamma adapter", …)`:

```typescript
  it("throws for a closed/resolved market so the dashboard degrades to the seed (not a fake live 100%)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ outcomes: '["Yes","No"]', outcomePrices: '["1","0"]', closed: true, active: false }),
    }) as any;
    await expect(fetchBeliefProb("631121")).rejects.toThrow(/closed|resolved/i);
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run test/adapters.test.ts`
Expected: FAIL — `fetchBeliefProb` returns `1` instead of throwing.

- [ ] **Step 3: Add the guard** in `lib/adapters/polymarket.ts`. In `fetchBeliefProb`, after `const m = await res.json();` and BEFORE parsing outcomes, insert:

```typescript
  // A resolved/closed market returns settled 0/1 prices; surface it as a feed failure so the dashboard
  // degrades to the verified seed (tagged `fallback`) rather than showing a fake "live" 100%/0%.
  if (m.closed === true || m.active === false) throw new Error("Gamma: market closed/resolved");
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/adapters.test.ts`
Expected: PASS (the existing open-market cases still pass — they have no `closed`/`active:false`).

- [ ] **Step 5: Commit**

```bash
git add lib/adapters/polymarket.ts test/adapters.test.ts
git commit -m "fix(data): degrade closed/resolved Polymarket markets to seed (no fake live 100%)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

> **Runbook note (Part C):** before the demo, check the Anthropic leg (`631121`) status. If it has resolved, drop it from the AI basket weights (or rely on `EnterBasket`'s `getDetermined` revert-safety, which refunds that slice) — see Task C5.

---

# PART B — Buy flow: harden the real-money mainnet path + lock the secret boundary

### Task B1: `server-only` guard on the Uniswap-key boundary

**Context:** `lib/config.ts` hard-fails at import without `UNISWAP_API_KEY` and must never reach the client bundle. Today this holds only by `import type` convention. `import "server-only"` makes any `"use client"` import a **build error** — a permanent guardrail for a real deployment.

**Files:**
- Modify: `lib/config.ts`

- [ ] **Step 1: Confirm `server-only` is available** (Next.js bundles it):

Run: `node -e "require.resolve('server-only')" && echo OK`
Expected: prints `OK`. If it errors, run `npm i server-only` first.

- [ ] **Step 2: Add the import** at the very top of `lib/config.ts` (before the `ADDR` import):

```typescript
import "server-only";
import { ADDR } from "@/lib/addresses";
```

- [ ] **Step 3: Verify the build still passes** (no client module imports `config.ts`):

Run: `rm -rf .next && npm run build`
Expected: green (6 routes). If it errors with "server-only ... Client Component", a `"use client"` file is importing `config.ts` transitively — fix that import (use `lib/addresses.ts`), do NOT remove the guard.

- [ ] **Step 4: Commit**

```bash
git add lib/config.ts package.json package-lock.json
git commit -m "chore(security): server-only guard on lib/config.ts (Uniswap key never reaches client)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task B2: minOut floor — cover WBTC 8dp + document the USDC.e≈\$1 assumption (real-money slippage safety)

**Context:** `resolveAssetMinOut` (`lib/lifi/assetQuotes.ts`) converts a USDC.e input to a slippage-floored token-out using the Uniswap `/quote` USD-per-token price. The math direction is correct; it assumes USDC.e≈\$1 (true within pennies) and `Math.floor` rounds the floor **down** (more conservative = safe for real money). 4 of 5 buckets buy **WBTC (8dp)**, which is untested. This task pins the 8dp path and documents the assumption.

**Files:**
- Modify: `lib/lifi/assetQuotes.ts` (doc comment only)
- Test: `test/asset-quotes.test.ts`

- [ ] **Step 1: Write the failing test** — add to `test/asset-quotes.test.ts`:

```typescript
const wbtc: AssetLeg = { kind: "asset", label: "x", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", ticker: "WBTC", swapFee: 500, weight: 0.4, decimals: 8 };

describe("resolveAssetMinOut — WBTC 8dp", () => {
  it("scales the floor by the token's decimals (8dp), not 18", async () => {
    // 1 WBTC = 64000 USDC -> 64 USDC.e buys 0.001 WBTC; 1% floor = 0.00099 WBTC = 99000 sats (8dp).
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(64000);
    const minOut = await resolveAssetMinOut(wbtc, 64_000_000n, 0.01);
    expect(minOut).toBe(99_000n); // 0.00099 * 1e8
  });
});
```

- [ ] **Step 2: Run it to verify it passes or fails**

Run: `npx vitest run test/asset-quotes.test.ts`
Expected: PASS (the existing 18dp logic already handles `decimals`). If it FAILS, the decimals scaling is wrong — fix `resolveAssetMinOut` so `BigInt(Math.floor(tokenOut * 10 ** decimals))` uses `leg.decimals ?? 18` (it already does at `assetQuotes.ts:12,15`). This test locks that behavior against regression.

- [ ] **Step 3: Document the assumption** — replace the doc comment above `resolveAssetMinOut` in `lib/lifi/assetQuotes.ts`:

```typescript
/** Convert a USDC.e input amount (6dp) into a slippage-floored minimum token output (token base units),
 *  using the Uniswap /quote USD price for 1 whole token (sized by leg.decimals; WBTC=8dp). The floor
 *  ASSUMES USDC.e ≈ $1 (true within pennies on Polygon) and Math.floor rounds DOWN — i.e. a slightly
 *  more conservative floor — so it never over-protects on real funds. The deployed EnterBasket also
 *  enforces this minAmountOut on-chain (defense in depth). Returns 0n if the quote feed is unavailable;
 *  buildSafeBasketContractCalls (basketEntry.ts) REFUSES to ship a 0-floor swap on real funds. */
```

- [ ] **Step 4: Run the suite green**

Run: `npx vitest run test/asset-quotes.test.ts test/basket-entry-safe.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/lifi/assetQuotes.ts test/asset-quotes.test.ts
git commit -m "test(lifi): pin WBTC 8dp minOut floor + document the USDC.e≈\$1 slippage assumption

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task B3: Test the `/api/basket-entry` route — the single server seam the live entry depends on

**Context:** The live LI.FI entry POSTs to `/api/basket-entry` to get the Uniswap-floored contract calls. The route validates input and refuses a 0-minOut swap, but the **HTTP handler itself** has no test. This adds 400/404/502/happy coverage so the real-money entry path can't silently regress. We mock `buildSafeBasketContractCalls` to avoid the server-only `config.ts` import and any network.

**Files:**
- Create: `test/basket-entry-route.test.ts`

- [ ] **Step 1: Write the failing test** — create `test/basket-entry-route.test.ts`:

```typescript
import { describe, it, expect, vi, afterEach } from "vitest";

// Mock the server-only builder so the route test needs no Uniswap key / network.
vi.mock("@/lib/lifi/basketEntry", () => ({
  buildSafeBasketContractCalls: vi.fn(),
}));

import { POST } from "@/app/api/basket-entry/route";
import { buildSafeBasketContractCalls } from "@/lib/lifi/basketEntry";

afterEach(() => vi.restoreAllMocks());

const ENTER = "0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0";
const RECIP = "0x00000000000000000000000000000000000000bE";
const req = (body: unknown) => new Request("http://localhost/api/basket-entry", { method: "POST", body: JSON.stringify(body) });

describe("POST /api/basket-entry", () => {
  it("400 on a missing/invalid field", async () => {
    const res = await POST(req({ slug: "ai", amount: 0, recipient: RECIP, enterBasket: ENTER }));
    expect(res.status).toBe(400);
  });

  it("400 on a non-address recipient", async () => {
    const res = await POST(req({ slug: "ai", amount: 5, recipient: "nope", enterBasket: ENTER }));
    expect(res.status).toBe(400);
  });

  it("404 on an unknown theme", async () => {
    const res = await POST(req({ slug: "does-not-exist", amount: 5, recipient: RECIP, enterBasket: ENTER }));
    expect(res.status).toBe(404);
  });

  it("502 when the builder throws (e.g. /quote down → refuses unprotected swap)", async () => {
    vi.mocked(buildSafeBasketContractCalls).mockRejectedValue(new Error("No Uniswap price for WETH"));
    const res = await POST(req({ slug: "ai", amount: 5, recipient: RECIP, enterBasket: ENTER }));
    expect(res.status).toBe(502);
  });

  it("200 with contractCalls on the happy path", async () => {
    vi.mocked(buildSafeBasketContractCalls).mockResolvedValue([{ fromAmount: "1" } as any]);
    const res = await POST(req({ slug: "ai", amount: 5, recipient: RECIP, enterBasket: ENTER }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.contractCalls)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails first, then passes**

Run: `npx vitest run test/basket-entry-route.test.ts`
Expected: PASS (the route already implements 400/404/502/200). If any case FAILS, the route's validation diverged from its contract — fix `app/api/basket-entry/route.ts` to match (it currently returns 400 for bad body/fields/addresses, 404 for unknown theme, 502 on builder throw, 200 with `{contractCalls}`).

- [ ] **Step 3: Confirm the full suite still green**

Run: `npx vitest run`
Expected: PASS (now 95+ tests).

- [ ] **Step 4: Commit**

```bash
git add test/basket-entry-route.test.ts
git commit -m "test(api): cover /api/basket-entry handler (400/404/502/200) — the live-entry seam

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task B4: Optional LI.FI API key on `createConfig` (live-demo reliability on real money)

**Context:** `initLifi` calls `createConfig({ integrator: "project-lynx" })` with no API key → anonymous, rate-limited. On a live real-money demo a 429 would kill the one-signature beat. LI.FI integrator keys are intended for client use (rate-limit keys, not secrets), so a `NEXT_PUBLIC_*` var is appropriate.

**Files:**
- Modify: `lib/lifi/enter.ts` (`initLifi`)
- Modify: `.env.example`

- [ ] **Step 1: Add the optional key** in `lib/lifi/enter.ts`. Replace the `createConfig({...})` call inside `initLifi`:

```typescript
  createConfig({
    integrator: "project-lynx",
    ...(process.env.NEXT_PUBLIC_LIFI_API_KEY ? { apiKey: process.env.NEXT_PUBLIC_LIFI_API_KEY } : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providers: [EVM({ getWalletClient: opts.getWalletClient as any, switchChain: opts.switchChain as any })],
  });
```

- [ ] **Step 2: Document the env var** — add to `.env.example`:

```bash
# Optional: LI.FI integrator API key (rate-limit key, safe to expose client-side). Avoids anonymous
# rate-limits on the live one-signature entry demo. Get one at https://li.quest / the LI.FI portal.
NEXT_PUBLIC_LIFI_API_KEY=
```

- [ ] **Step 3: Verify typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: clean + green.

- [ ] **Step 4: Commit**

```bash
git add lib/lifi/enter.ts .env.example
git commit -m "feat(lifi): optional integrator API key on createConfig for live-demo rate-limit headroom

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task B5: Lock cross-chain OFF for the real-money demo (it is broken-by-construction)

**Context:** With `NEXT_PUBLIC_ENABLE_CROSSCHAIN_ENTRY=true`, `buildEnterQuote` bridges to **native USDC** (`enter.ts:59`) but every contract call declares **USDC.e** as `fromTokenAddress` (`basket.ts:103`) with no conversion hop — the executor would arrive holding the wrong token and the calls would fail. It is **off by default**. This task makes that posture explicit so a real-money demo can't accidentally enable a broken path, and documents it.

**Files:**
- Modify: `.env.example`
- Modify: `lib/lifi/entryPlan.ts` (comment only)

- [ ] **Step 1: Document the flag as demo-OFF** — add/replace in `.env.example`:

```bash
# Cross-chain entry (Ethereum/Base → Polygon) is an EXPERIMENTAL stretch and is currently
# broken-by-construction (bridge delivers native USDC; contract calls expect USDC.e — no conversion hop).
# KEEP THIS UNSET/false for the real-money demo. The mainnet money spine is same-chain Polygon (137).
# NEXT_PUBLIC_ENABLE_CROSSCHAIN_ENTRY=false
```

- [ ] **Step 2: Harden the comment** in `lib/lifi/entryPlan.ts` — replace the doc comment above `planEntry`:

```typescript
/**
 * Pure selector: connected-wallet chain → the entry plan (LI.FI params + chips), or {supported:false}.
 * Polygon (137) is the always-on same-chain real-money spine. Ethereum (1)/Base (8453) are an
 * EXPERIMENTAL cross-chain stretch behind opts.crossChain and are currently broken-by-construction
 * (see buildEnterQuote: bridge toToken is native USDC but contract calls expect USDC.e) — keep
 * opts.crossChain false for any real-money demo. Everything else (incl. Arc, undefined) is unsupported.
 */
```

- [ ] **Step 3: Confirm the existing entry-plan tests still pass** (behavior unchanged):

Run: `npx vitest run test/entry-plan.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add .env.example lib/lifi/entryPlan.ts
git commit -m "docs(lifi): mark cross-chain entry experimental/OFF; Polygon-137 is the real-money spine

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task B6: Bind the on-screen Uniswap evidence hash to env (provably the real swap)

**Context:** `EnterSheet.tsx:19` hardcodes the `$7k` evidence hash. Sourcing it from env keeps the on-screen "verified evidence" link provably tied to whatever real swap you submit to the feedback form, and lets you mint a fresh hash without a code edit.

**Files:**
- Modify: `components/EnterSheet.tsx:19`
- Modify: `.env.example`

- [ ] **Step 1: Read the hash from env** in `components/EnterSheet.tsx`. Replace line 19:

```typescript
// Real, recorded standalone Uniswap $7k swap — shown as separate evidence (NOT part of the basket).
// Sourced from env so the on-screen link provably matches the swap submitted to the Uniswap form.
const UNISWAP_EVIDENCE =
  process.env.NEXT_PUBLIC_UNISWAP_EVIDENCE_TX ?? "0x23a05c509b64c36ef38671d19a965f8464ca1c2876848637924972a72327cbde";
```

- [ ] **Step 2: Document the env var** — add to `.env.example`:

```bash
# The recorded standalone Uniswap Trading-API /swap tx hash shown as on-screen $7k evidence.
# Defaults to the recorded 0x23a0…cbde; override if you mint a fresh prize swap (scripts/runPrizeSwap.ts).
NEXT_PUBLIC_UNISWAP_EVIDENCE_TX=
```

- [ ] **Step 3: Verify typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: clean + green. (`NEXT_PUBLIC_*` is inlined client-side.)

- [ ] **Step 4: Commit**

```bash
git add components/EnterSheet.tsx .env.example
git commit -m "feat(uniswap): source on-screen $7k evidence hash from env (provably the submitted swap)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

# PART C — Live-ops runbook (real money on mainnet; USER-executed; the sponsor gates)

> These steps move **real funds** and need a wallet/passkey/keys — they are **not** code and must be run by you, not an agent. Use a **throwaway wallet** only. The wallet `0x67d9A60578c931b322C85b980723631f8914Dc14` had its key shared in plaintext earlier → treat it as compromised; never put meaningful funds in it. Record every resulting hash in `README.md`.

### Task C1: Pre-flight

- [ ] Fill `.env.local`: `UNISWAP_API_KEY`, `UNISWAP_TRADING_API_BASE`, `POLYGON_RPC` (a paid/admin RPC to dodge rate limits), `NEXT_PUBLIC_CIRCLE_CLIENT_KEY`, `NEXT_PUBLIC_ENTER_BASKET=0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0`, optional `EQUITIES_API_KEY`, optional `NEXT_PUBLIC_LIFI_API_KEY` (Task B4).
- [ ] Fund the throwaway wallet **on Polygon mainnet**: ~2 POL (gas) + ~5–10 **native USDC** (`0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`). The same-chain entry swaps native USDC → USDC.e.
- [ ] `npm run dev`; load `/theme/ai` ~30s before demoing so live feeds warm up.
- [ ] **Green gate:** `npx vitest run` (all green) · `npx tsc --noEmit` (clean) · `rm -rf .next && npm run build` (green) · `export PATH="$HOME/.foundry/bin:$PATH"; export POLYGON_RPC="$(grep '^POLYGON_RPC=' .env.local | cut -d= -f2-)"; (cd contracts && forge test)` (7/7).

### Task C2: Uniswap — Best API Integration ($7k) — the gate is a FORM

- [ ] **Submit the Uniswap Developer Feedback Form** with swap hash `0x23a05c509b64c36ef38671d19a965f8464ca1c2876848637924972a72327cbde` (form link at the Uniswap booth / Trading API developer portal). **This is the single highest-leverage action in the project** — the swap alone does not win the prize.
- [ ] (Optional) mint a fresh same-day hash: `UNISWAP_API_KEY=… POLYGON_RPC=… PRIVATE_KEY=0x… npx tsx scripts/runPrizeSwap.ts` → set `NEXT_PUBLIC_UNISWAP_EVIDENCE_TX` to the new hash (Task B6).
- [ ] Verify on `/theme/ai`: asset cards show "uniswap /quote oracle" prices (live) and the asset-leg badge reads "live · uniswap" (Task A3).
- [ ] **Acceptance:** swap tx status 1 on Polygon **and** feedback form submitted.

### Task C3: LI.FI — Composer + Best UX — one live same-chain mainnet route

- [ ] On `/theme/ai`, click **Enter basket**, connect the throwaway wallet **on Polygon (137)** holding native USDC. The Sign step shows **2 chips** (`Swap · USDC→USDC.e`, `EnterBasket · split across legs`) — no Bridge.
- [ ] Enter a **small** amount (e.g. **5 USDC**), **Sign once**. Under the hood: `POST /api/basket-entry` (real Uniswap floors) → `buildEnterQuote({fromChainId:137, fromToken: nativeUSDC, toToken: USDC.e})` → `executeRoute`.
- [ ] Confirm on Polygonscan (the sheet links it): the `EnterBasket` tx; your wallet now holds the **YES+NO outcome tokens** + the **sleeve tokens** (AI = WETH + LINK). **Record the tx hash.**
- [ ] **Acceptance:** one real LI.FI route executes end-to-end on Polygon mainnet; the neutral set + ≥1 sleeve token land in the recipient wallet. Revert-safety: if a leg under-delivers it refunds that slice's USDC.e (nothing stranded).

### Task C4: Arc — Target A + B — real USDC-gas userOp on Arc Testnet

- [ ] Open the **Account** slide-over → **Create passkey wallet** (do this *before* the live demo, not on stage).
- [ ] Fund the Arc smart account from `https://faucet.circle.com` (Arc Testnet USDC); confirm USDC balance + unified NAV render.
- [ ] Click **Send USDC-gas test op** → record the **ArcScan** hash (`https://testnet.arcscan.app/tx/<hash>`). Gas is paid in USDC via the Paymaster (`paymaster:true`, v0.8 `0x3BA9…8966`).
- [ ] **Acceptance:** passkey wallet creates; NAV renders Arc USDC + Polygon basket; one USDC-gas userOp confirmed on Arc Testnet.

### Task C5: Record + dry-run + final gate

- [ ] Add the LI.FI (Task C3) and Arc (Task C4) hashes to the `README.md` "Recorded tx hashes" table; tick the Uniswap-form item.
- [ ] **Check the Anthropic leg** (`631121`) status (it resolves 2026-06-30). If resolved: rely on `EnterBasket`'s `getDetermined` revert-safety (the slice refunds) **or** temporarily zero its weight in `lib/baskets/registry.ts` and re-normalize the AI legs so the demo basket only enters open markets. The A4 guard already keeps the dashboard honest.
- [ ] **Demo dry-run at the exact presentation resolution** with live feeds on; rehearse the fallback (kill a feed → confirm "fallback · cached" badges, never a fake "live").
- [ ] **Final regression gate** (must be green before recording the demo video): `npx vitest run` · `npx tsc --noEmit` · `rm -rf .next && npm run build` · `(cd contracts && forge test)`.

---

## Self-Review (against the goal)

- **Data/dashboard works + honest:** A1 (branded hero + honest subtitle), A2 (no fallback saturation), A3 (honest source badge), A4 (resolved-market guard). ✅
- **Buy flow works on mainnet with real money:** the same-chain Polygon spine is the verified real-money path; B1 (secret boundary), B2 (slippage floor correctness incl. WBTC), B3 (entry-seam tests), B4 (rate-limit headroom), B5 (no broken cross-chain path), B6 (provable evidence). Live execution = C3. ✅
- **100% qualifies all 3 sponsors:** Uniswap = C2 (form) + the live `/quote` oracle/floors; LI.FI = C3 (live Composer route) + the 4-step sheet; Arc = C4 (real USDC-gas userOp + unified NAV). ✅
- **Minimizes overlap:** the Overlap Fence excludes every file other worktrees own (terminal, live feeds, design, Browse). ✅
- **No placeholders:** every code task has the exact test, the exact edit, the exact command, and a commit. Live-ops are explicitly user-run. ✅

## Execution options

**Plan complete and saved to `docs/superpowers/plans/2026-06-14-core-product-mainnet-readiness.md`.**

1. **Subagent-Driven (recommended):** dispatch a fresh subagent per task (A1 → … → B6), review between tasks, fast iteration. Live-ops (Part C) remain user-run.
2. **Inline Execution:** execute the code tasks in this session with checkpoints, then hand off Part C.
