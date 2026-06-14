# Same-chain Polygon (137) EnterSheet entry spine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the one-signature LI.FI Composer entry demo-runnable end-to-end on Polygon (137) by wiring `EnterSheet.tsx` to the same-chain spine `buildEnterQuote` already supports, with cross-chain (1/8453) demoted to a feature-flagged stretch.

**Architecture:** A pure, unit-tested `planEntry()` selector maps the connected wallet's chain → the LI.FI params + chip labels for that mode. The sheet renders generically from that plan (length-adaptive chips, Polygon-default connect/switch). `buildEnterQuote` delivers USDC.e in same-chain mode so the LI.FI executor holds the token every `EnterBasket` call consumes. A small adjacent change renders every sleeve token as its own card on the theme page.

**Tech Stack:** TypeScript + viem (`Address`), vitest, `@lifi/sdk` (`getContractCallsQuote`), wagmi (already configured for `[mainnet, base, polygon]` in `lib/wagmi.ts`), Next.js App Router, LI.FI MCP (`get-quote-with-calls`) for shape verification.

**Reference spec:** `docs/superpowers/specs/2026-06-13-same-chain-enter-sheet-design.md`

---

## File Structure

- `lib/lifi/entryPlan.ts` *(create)* — pure `planEntry()` + `EntryPlan`/`EntrySelection` types + `NATIVE_USDC` source-token map. Client-safe (no server config import).
- `test/entry-plan.test.ts` *(create)* — `planEntry` unit tests.
- `lib/lifi/enter.ts` *(modify)* — `buildEnterQuote` delivers `toToken: USDC.e` in same-chain (137) mode; cross-chain unchanged.
- `test/enter-quote.test.ts` *(modify)* — same-chain assertion `toToken === ADDR.usdce`.
- `components/EnterSheet.tsx` *(modify)* — consume `planEntry`; chain-adaptive connect/switch (Polygon default) + length-adaptive chips; `sign()` reads `fromChainId`/`fromToken` from the plan.
- `app/theme/[slug]/page.tsx` *(modify)* — render a card per sleeve asset leg (was `assetLegs[0]` only).

---

## Task 1: Pure `planEntry` selector

**Files:**
- Create: `lib/lifi/entryPlan.ts`
- Test: `test/entry-plan.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { planEntry, type EntryPlan } from "@/lib/lifi/entryPlan";
import { ADDR } from "@/lib/addresses";

describe("planEntry", () => {
  it("Polygon (137) → same-chain plan: 2 steps, native USDC, no Bridge", () => {
    const p = planEntry(137) as EntryPlan;
    expect(p.mode).toBe("same-chain");
    expect(p.fromChainId).toBe(137);
    expect(p.fromToken).toBe(ADDR.usdcNative);
    expect(p.steps).toHaveLength(2);
    expect(p.steps.join(" ").toLowerCase()).not.toContain("bridge");
  });

  it("Ethereum/Base are unsupported unless the cross-chain flag is on", () => {
    expect(planEntry(1)).toEqual({ supported: false });
    expect(planEntry(8453)).toEqual({ supported: false });
  });

  it("with crossChain:true, Base (8453) → cross-chain plan: 3 steps incl. Bridge", () => {
    const p = planEntry(8453, { crossChain: true }) as EntryPlan;
    expect(p.mode).toBe("cross-chain");
    expect(p.fromChainId).toBe(8453);
    expect(p.fromToken).toBe("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
    expect(p.steps).toHaveLength(3);
    expect(p.steps.join(" ").toLowerCase()).toContain("bridge");
  });

  it("with crossChain:true, Ethereum (1) uses the mainnet USDC source token", () => {
    const p = planEntry(1, { crossChain: true }) as EntryPlan;
    expect(p.fromToken).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  });

  it("unknown / undefined chain → unsupported (even with the flag on)", () => {
    expect(planEntry(42161, { crossChain: true })).toEqual({ supported: false });
    expect(planEntry(undefined, { crossChain: true })).toEqual({ supported: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/entry-plan.test.ts`
Expected: FAIL — `Cannot find module '@/lib/lifi/entryPlan'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/lifi/entryPlan.ts`:

```typescript
import type { Address } from "viem";
import { ADDR } from "@/lib/addresses";

/** Native USDC the user funds the entry with, per source chain. Polygon = the same-chain demo spine. */
export const NATIVE_USDC: Record<1 | 8453 | 137, Address> = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC (Ethereum)
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC (Base)
  137: ADDR.usdcNative, // native USDC (Polygon)
};

export type EntryMode = "same-chain" | "cross-chain";
export type EntryPlan = {
  mode: EntryMode;
  fromChainId: 1 | 8453 | 137;
  fromToken: Address;
  /** Route chips shown in the Sign step (2 same-chain, 3 cross-chain). */
  steps: string[];
};
export type EntrySelection = EntryPlan | { supported: false };

const SAME_CHAIN_STEPS = ["Swap · USDC→USDC.e", "EnterBasket · split across legs"];
const CROSS_CHAIN_STEPS = ["Swap", "Bridge · to Polygon", "EnterBasket · split across legs"];

/**
 * Pure selector: connected-wallet chain → the entry plan (LI.FI params + chips), or {supported:false}.
 * Polygon (137) is the always-on same-chain spine; Ethereum (1)/Base (8453) are the cross-chain stretch,
 * gated behind opts.crossChain. Everything else (incl. Arc, undefined) is unsupported.
 */
export function planEntry(chainId: number | undefined, opts?: { crossChain?: boolean }): EntrySelection {
  if (chainId === 137) {
    return { mode: "same-chain", fromChainId: 137, fromToken: NATIVE_USDC[137], steps: SAME_CHAIN_STEPS };
  }
  if ((chainId === 1 || chainId === 8453) && opts?.crossChain) {
    return { mode: "cross-chain", fromChainId: chainId, fromToken: NATIVE_USDC[chainId], steps: CROSS_CHAIN_STEPS };
  }
  return { supported: false };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/entry-plan.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/lifi/entryPlan.ts test/entry-plan.test.ts
git commit -m "feat(lifi): pure planEntry() chain→entry selector (same-chain 137 + flagged cross-chain) (TDD)"
```

---

## Task 2: `buildEnterQuote` delivers USDC.e in same-chain mode

**Files:**
- Modify: `lib/lifi/enter.ts:49-60` (the `buildEnterQuote` body)
- Test: `test/enter-quote.test.ts:23` (the same-chain `toToken` assertion)

**Why:** Each `contractCall` consumes USDC.e (`fromTokenAddress: ADDR.usdce`, `toApprovalAddress: enterBasket`). The LI.FI executor approves/forwards the call's token, so it must HOLD that token — i.e. `toToken` must be USDC.e. The current code delivers native USDC on the same-chain path, which the executor can't forward as USDC.e. (Cross-chain is an unverified stretch — left unchanged to avoid touching it.)

- [ ] **Step 1: Update the failing assertion** in `test/enter-quote.test.ts` — change the same-chain `toToken` expectation:

```typescript
    expect(req.fromChain).toBe(137);
    expect(req.toChain).toBe(137);
    expect(req.toToken).toBe(ADDR.usdce);
```

(Replaces the existing `expect(req.toToken).toBe(ADDR.usdcNative);` on the same-chain test. Leave the cross-chain test untouched — it only asserts `fromChain`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/enter-quote.test.ts`
Expected: FAIL — same-chain test: `expected '0x2791…' to be '0x3c49…'` (code still returns `usdcNative`).

- [ ] **Step 3: Edit `buildEnterQuote`** in `lib/lifi/enter.ts` — branch `toToken` by mode:

```typescript
export async function buildEnterQuote(p: EnterQuoteParams): Promise<LiFiStep> {
  // Same-chain (137) spine: deliver USDC.e — the token every EnterBasket contractCall consumes — so the
  // LI.FI executor holds USDC.e to approve/forward each call (verified same-chain USDC→USDC.e route).
  // Cross-chain (1|8453) stays on native USDC: the unverified stretch path, left unchanged here.
  const sameChain = p.fromChainId === 137;
  const req: ContractCallsQuoteRequest = {
    fromChain: p.fromChainId,
    fromToken: p.fromToken,
    fromAddress: p.fromAddress,
    toChain: 137,
    toToken: sameChain ? ADDR.usdce : ADDR.usdcNative,
    fromAmount: p.fromAmount,
    contractCalls: p.contractCalls,
  };
  return getContractCallsQuote(req);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/enter-quote.test.ts && npx tsc --noEmit`
Expected: PASS (2 tests) + tsc clean.

- [ ] **Step 5: Verify the shape against the live LI.FI Composer (MCP)**

Use the `lifi` MCP `get-quote-with-calls` to confirm the same-chain Composer accepts `toToken = USDC.e`. Minimal request:
- `fromChain: 137`, `toChain: 137`
- `fromToken: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` (native USDC), `toToken: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` (USDC.e)
- `fromAddress: 0x67d9A60578c931b322C85b980723631f8914Dc14` (the recorded demo wallet), `fromAmount: "5000000"`
- `contractCalls`: one call from `buildBasketContractCalls("ai", 5000000n, fromAddress, "0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0")[0]` (a prediction call) — i.e. `{ fromAmount, fromTokenAddress: USDC.e, toContractAddress: EnterBasket, toContractCallData, toContractGasLimit }`.

Expected: a quote with an `estimate` + `transactionRequest`, routing through the LI.FI executor `0x2dfaDAB8266483beD9Fd9A292Ce56596a2D1378D` (same-chain Zap). 
**If LI.FI instead requires `toToken = native USDC`** (rejects USDC.e as the dest), revert Step 3 to `toToken: ADDR.usdcNative` for both modes and restore the test assertion to `ADDR.usdcNative`, then re-run Step 4. Record which shape verified in the commit message.

- [ ] **Step 6: Commit**

```bash
git add lib/lifi/enter.ts test/enter-quote.test.ts
git commit -m "fix(lifi): same-chain entry delivers USDC.e (executor holds the token each call consumes) (TDD)"
```

---

## Task 3: Wire `EnterSheet` to the chain-adaptive plan

**Files:**
- Modify: `components/EnterSheet.tsx`

No unit test (React component, no headless browser here) — verified via `tsc` + `next build` + a dev-server eyeball. Live route execution is Task 9 (user-gated). Apply these exact edits:

- [ ] **Step 1: Add the import + feature flag + remove the now-unused USDC source constants**

Replace the top import block + constants. Change:

```typescript
import { initLifi, buildEnterQuote, convertQuoteToRoute, executeRoute } from "@/lib/lifi/enter";
import type { BuyLeg } from "@/components/BuyBox";
```

to:

```typescript
import { initLifi, buildEnterQuote, convertQuoteToRoute, executeRoute } from "@/lib/lifi/enter";
import { planEntry } from "@/lib/lifi/entryPlan";
import type { BuyLeg } from "@/components/BuyBox";

/** Cross-chain (Ethereum/Base) entry is a feature-flagged stretch; default build is the Polygon spine. */
const CROSSCHAIN = process.env.NEXT_PUBLIC_ENABLE_CROSSCHAIN_ENTRY === "true";
```

Then delete the two now-unused lines:

```typescript
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ETH = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
```

(Keep `ENTER_BASKET` and `UNISWAP_EVIDENCE`.)

- [ ] **Step 2: Replace the chain-derivation + chip state**

Change:

```typescript
  const chainId = walletClient?.chain?.id;
  const onAllowedChain = chainId === 1 || chainId === 8453;
```

to:

```typescript
  const chainId = walletClient?.chain?.id;
  const plan = planEntry(chainId, { crossChain: CROSSCHAIN });
  const onSupportedChain = "mode" in plan;
  const steps = onSupportedChain ? plan.steps : ["Swap · USDC→USDC.e", "EnterBasket · split across legs"];
```

Change the chip state initialiser:

```typescript
  const [chips, setChips] = useState<ChipState[]>(["idle", "idle", "idle"]);
```

to:

```typescript
  const [chips, setChips] = useState<ChipState[]>([]);
```

- [ ] **Step 3: Make `reset()` length-aware**

Change:

```typescript
  function reset() {
    setStep(1);
    setChips(["idle", "idle", "idle"]);
```

to:

```typescript
  function reset() {
    setStep(1);
    setChips(steps.map(() => "idle"));
```

- [ ] **Step 4: Rewrite `sign()` to read the plan + generic progress**

Replace the whole `sign()` function with:

```typescript
  async function sign() {
    try {
      setSigning(true);
      setChips(steps.map((_, i) => (i === 0 ? "pending" : "idle")));
      if (!address || !walletClient) throw new Error("Connect a wallet first.");
      if (!("mode" in plan)) throw new Error("Switch to Polygon to enter.");
      if (ENTER_BASKET === "0x0000000000000000000000000000000000000000") throw new Error("EnterBasket address not set.");
      const totalUsdce = BigInt(Math.round(amount * 1e6));
      const res = await fetch("/api/basket-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, amount, recipient: address, enterBasket: ENTER_BASKET }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `basket-entry ${res.status}`);
      const contractCalls = body.contractCalls;
      initLifi({ getWalletClient: async () => walletClient, switchChain: async () => walletClient });
      const quote = await buildEnterQuote({
        fromChainId: plan.fromChainId,
        fromToken: plan.fromToken,
        fromAddress: address,
        fromAmount: totalUsdce.toString(),
        contractCalls,
      });
      setChips(steps.map((_, i) => (i === 0 ? "done" : i === 1 ? "pending" : "idle")));
      const route = convertQuoteToRoute(quote);
      await executeRoute(route, {
        updateRouteHook: (r) => {
          const done = r.steps.filter((s) => s.execution?.status === "DONE").length;
          setChips(steps.map((_, i) => (i < done ? "done" : i === done ? "pending" : "idle")));
          const hash = r.steps.flatMap((s) => s.execution?.process ?? []).map((p) => p.txHash).filter(Boolean).pop();
          if (hash) setTxHash(hash);
        },
      });
      setChips(steps.map(() => "done"));
      setResult("success");
      setStep(4);
    } catch (e) {
      setErrMsg((e as Error).message);
      setResult("refund");
      setStep(4);
    } finally {
      setSigning(false);
    }
  }
```

- [ ] **Step 5: Update the Connect step (Step 1) copy + wrong-chain branch**

In the `{step === 1 && (` block, change the intro `<p>` to Polygon-centric copy:

```tsx
            <p style={{ margin: "0 0 18px", fontSize: 13.5, lineHeight: 1.55, color: "#AAB1BC" }}>
              Connect on <span style={{ color: "#FFFFFF" }}>Polygon</span> with USDC. We swap it to USDC.e and
              split it across the basket — markets and assets — in one signature.
            </p>
```

Change the wrong-network branch condition + button. Change `) : !onAllowedChain ? (` to `) : !onSupportedChain ? (`, the message text, and the switch button:

```tsx
            ) : !onSupportedChain ? (
              <div style={{ animation: "lynxFade .2s ease" }}>
                <div style={{ display: "flex", gap: 11, padding: "14px 15px", background: "rgba(229,84,75,0.08)", border: "1px solid rgba(229,84,75,0.35)", borderRadius: 9, marginBottom: 12 }}>
                  <span style={{ color: "#E5544B", flexShrink: 0 }}>!</span>
                  <div>
                    <span style={{ display: "block", fontSize: 13.5, color: "#FFFFFF", marginBottom: 2 }}>You&apos;re on the wrong network.</span>
                    <span style={{ fontSize: 12.5, color: "#AAB1BC" }}>Entry runs on Polygon. Switch network to continue.</span>
                  </div>
                </div>
                <button onClick={() => switchChain({ chainId: 137 })} style={btnCta({ width: "100%", height: 46 })}>
                  Switch to Polygon
                </button>
              </div>
            ) : (
              <button onClick={() => setStep(2)} style={btnCta({ width: "100%", height: 48 })}>
                Continue → ({chainId === 137 ? "Polygon" : chainId === 1 ? "Ethereum" : "Base"})
              </button>
            )}
```

- [ ] **Step 6: Render chips from `steps` in the Sign step (Step 3)**

In the `{step === 3 && (` block, update the intro `<p>` and replace the hard-coded chip array. Change the `<p>`:

```tsx
            <p style={{ margin: "0 0 16px", fontSize: 13.5, lineHeight: 1.55, color: "#AAB1BC" }}>
              LI.FI Composer assembles the whole route from your signature and splits the deposit across the
              bucket&apos;s markets and assets.
            </p>
```

Change the chip `.map`:

```tsx
              {steps.map((c, i) => (
```

(was `{["Swap", "Bridge · to Polygon", "EnterBasket · split across markets"].map((c, i) => (`. The rest of the chip JSX is unchanged.)

- [ ] **Step 7: Verify it compiles + builds**

Run: `npx tsc --noEmit && npm run build`
Expected: tsc clean; build succeeds (routes incl. `/api/basket-entry`). No unused-var error for `USDC_BASE`/`USDC_ETH` (deleted) or `onAllowedChain` (renamed).

- [ ] **Step 8: Manual dev-server eyeball**

Run (if no dev server on :3000): `npm run dev` then `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/theme/ai` → expect `200`. In a browser, open `/theme/ai`, click **Enter basket**, confirm: connecting on a non-Polygon chain shows "Switch to Polygon"; on Polygon the Sign step shows **2** chips (Swap · USDC→USDC.e / EnterBasket), no "Bridge". (Do NOT sign a live tx — that's Task 9.)

- [ ] **Step 9: Commit**

```bash
git add components/EnterSheet.tsx
git commit -m "feat(enter): chain-adaptive EnterSheet on the same-chain Polygon (137) spine (cross-chain flagged)"
```

---

## Task 4: Render every sleeve token as its own card (theme page)

**Files:**
- Modify: `app/theme/[slug]/page.tsx:65` and the asset-leg render block (`:236-258`)

- [ ] **Step 1: Drop the single-leg alias**

Change `app/theme/[slug]/page.tsx:65`:

```typescript
  const assetLegs = view.legs.filter((l) => l.kind === "asset");
  const assetLeg = assetLegs[0];
```

to:

```typescript
  const assetLegs = view.legs.filter((l) => l.kind === "asset");
```

(Delete the `const assetLeg = assetLegs[0];` line — `polygonNav` on the next line already sums `assetLegs`.)

- [ ] **Step 2: Map the asset-leg card over every sleeve leg**

Replace the `{assetLeg && ( … )}` block (the single asset-leg card) with a `.map` over `assetLegs`:

```tsx
            {/* asset sleeve — one card per token */}
            {assetLegs.map((leg, i) => (
              <div key={`asset-${i}`} style={{ display: "flex", alignItems: "center", gap: 20, padding: "15px 18px", ...PANEL }}>
                <div style={{ flex: 1.5, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14.5, color: "#FFFFFF" }}>
                    <span style={{ color: "#E8EBEF", fontSize: 9 }}>◆</span>
                    {leg.label}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 11, color: "#E8EBEF" }}>
                    <span>◆</span>live · uniswap <span style={{ color: "#7A828D" }}>(Polygon)</span>
                  </span>
                </div>
                <div style={{ width: 148, display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 22, color: "#E8EBEF", fontFeatureSettings: "'tnum' 1", lineHeight: 1 }}>${fmt(leg.priceUsd)}</span>
                  <span style={{ fontSize: 10.5, color: "#7A828D", fontFamily: MONO }}>uniswap /quote oracle</span>
                </div>
                <CardSpark color="#E8EBEF" />
                <div style={{ width: 60, textAlign: "right", display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end", flexShrink: 0 }}>
                  <span style={{ fontFamily: MONO, fontSize: 15, color: "#FFFFFF", fontFeatureSettings: "'tnum' 1" }}>{Math.round(leg.weight * 100)}%</span>
                  <span style={{ fontSize: 10, color: "#7A828D" }}>weight</span>
                </div>
              </div>
            ))}
```

- [ ] **Step 3: Verify it compiles + builds**

Run: `npx tsc --noEmit && npm run build`
Expected: tsc clean (no unused `assetLeg`); build succeeds.

- [ ] **Step 4: Commit**

```bash
git add "app/theme/[slug]/page.tsx"
git commit -m "feat(dashboard): render a card per sleeve token (AI = WETH + LINK), not just the first"
```

---

## Task 5: Full regression + tracker update

**Files:**
- Modify: `tasks/todo.md`

- [ ] **Step 1: Run the full suite + build**

Run:
```bash
npx vitest run && npx tsc --noEmit && npm run build
```
Expected: all vitest green (prior 71 + 5 new `planEntry` = 76; `enter-quote` count unchanged at 2), tsc clean, build green.

- [ ] **Step 2: Curl the live routes** (dev server running)

Run:
```bash
curl -s -o /dev/null -w "home %{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "theme %{http_code}\n" http://localhost:3000/theme/ai
```
Expected: `home 200`, `theme 200`.

- [ ] **Step 3: Update `tasks/todo.md`** — under "On-chain asset sleeve + 3-track qualification", check off the sleeve-card render and mark the EnterSheet same-chain wiring done. Replace the two trailing lines:

```markdown
- [x] **Sleeve cards:** dashboard renders one card per sleeve token (AI = WETH + LINK), matching NAV/securities/Enter-sheet.
- [x] **EnterSheet same-chain wiring:** `planEntry()` selector + chain-adaptive sheet on the Polygon (137) spine; same-chain `buildEnterQuote` delivers USDC.e; cross-chain behind `NEXT_PUBLIC_ENABLE_CROSSCHAIN_ENTRY`. Live execution + Arc artifact remain USER/live (below).
- [ ] **Task 9 (USER / live):** execute ONE live LI.FI same-chain (137) route from a Polygon wallet holding native USDC; Arc Paymaster/CCTP artifact (Circle MCP-confirmed); submit Uniswap Developer Feedback Form with swap `0x23a0…cbde`; record hashes in README.
```

- [ ] **Step 4: Commit**

```bash
git add tasks/todo.md
git commit -m "docs(todo): same-chain EnterSheet spine + sleeve cards done; Task 9 live items remain"
```

---

## Self-Review

**Spec coverage:** §2 funding model "already on Polygon" → Task 3 (Polygon-default connect). §2 cross-chain flag → Task 1 (`opts.crossChain`) + Task 3 (`CROSSCHAIN`). §3.1 `planEntry` → Task 1. §3.2 same-chain `toToken: USDC.e` → Task 2 (+ MCP gate, Step 5). §3.3 sheet wiring (chips/connect/sign) → Task 3. §3.4 flag → Task 1+3. §6 testing → Tasks 1,2 (unit) + Task 3 Step 8 / Task 5 (manual + regression). §7 sleeve cards → Task 4. No uncovered requirement.

**Placeholder scan:** every code step shows complete code; the one branch (Task 2 Step 5 MCP gate) gives the concrete primary value (`USDC.e`) plus an explicit, fully-specified fallback — not a vague TODO.

**Type consistency:** `EntryPlan`/`EntrySelection`/`planEntry`/`NATIVE_USDC` defined in Task 1 are consumed identically in Task 3 (`"mode" in plan`, `plan.fromChainId`, `plan.fromToken`, `plan.steps`). `buildEnterQuote`'s `EnterQuoteParams` (`fromChainId: 1|8453|137`) accepts `plan.fromChainId` with no cast. `ADDR.usdce`/`ADDR.usdcNative` match `lib/addresses.ts`. `view.legs` `LegView` has `label`/`priceUsd`/`weight` (used in Task 4, same fields the old single card used).
