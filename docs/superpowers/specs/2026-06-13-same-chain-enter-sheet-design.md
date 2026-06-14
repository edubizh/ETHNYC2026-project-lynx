# Design — Same-chain Polygon (137) entry spine for `EnterSheet`

**Date:** 2026-06-13 · **Status:** approved-direction, spec for review · **Branch:** `main`
**Follow-up to:** `docs/superpowers/specs/2026-06-13-onchain-asset-sleeve-design.md` (Task 9 / EnterSheet wiring)

## 1. Goal

Make the one-signature LI.FI Composer flow **demo-runnable end-to-end on Polygon (137)**. Today
`EnterSheet.tsx` is hard-wired to the **cross-chain** path only — it requires connecting on Ethereum/Base
(`onAllowedChain = chainId === 1 || chainId === 8453`), passes `fromChainId: chainId as 1 | 8453`, and
renders a fixed 3-step "Swap → Bridge → EnterBasket" chip sequence. The same-chain mode that
`buildEnterQuote` already supports (`fromChainId: 137`) is unreachable from the UI. This design wires the
sheet to the same-chain spine as the **primary** path and demotes cross-chain to a **feature-flagged
stretch**.

## 2. Locked decisions

1. **Funding model = "already on Polygon".** The connected wallet holds native USDC on Polygon mainnet
   (demo = the pre-funded throwaway wallet). The same-chain LI.FI route swaps that native USDC → USDC.e and
   fans the deposit across the legs. **Arc stays the account/NAV origin story + a SEPARATE Arc-Testnet
   artifact** (Paymaster userOp or CCTP) — it is *not* a step inside the Polygon entry, because Arc is
   testnet and Polygon execution is mainnet (testnet value cannot fund a mainnet entry; an in-sheet
   Arc→Polygon CCTP would be narrative-only and would only add failure surface to the critical path).
2. **Same-chain primary, cross-chain feature-flagged.** Default build is Polygon-only. Cross-chain
   (1/8453) is gated behind `NEXT_PUBLIC_ENABLE_CROSSCHAIN_ENTRY` and kept as backup qualification evidence.
3. **No contract redeploy, no new live execution in this slice.** Live route execution + the Arc artifact
   are Task 9 (user-gated, manual). This slice delivers the UI wiring + tested selection logic.

## 3. Architecture

A small **pure `planEntry()` helper** drives a **chain-adaptive sheet**. The sheet stops hard-coding the
3-step bridge sequence and instead renders whatever steps the plan returns. *(Rejected alternatives:
hard-removing cross-chain — loses the flagged stretch evidence; a separate sheet / mode-prop — more surface,
no benefit over a pure selector.)*

### 3.1 `lib/lifi/entryPlan.ts` *(new, pure, unit-tested, client-safe)*

```typescript
export type EntryPlan = {
  mode: "same-chain" | "cross-chain";
  fromChainId: 1 | 8453 | 137;
  fromToken: Address;   // native USDC on the source chain
  steps: string[];      // chip labels (2 same-chain, 3 cross-chain)
};

export function planEntry(
  chainId: number | undefined,
  opts?: { crossChain?: boolean },
): EntryPlan | { supported: false };
```

- `137` → `{ mode:"same-chain", fromChainId:137, fromToken: ADDR.usdcNative, steps:["Swap · USDC→USDC.e","EnterBasket · split across legs"] }` (no Bridge step).
- `1` → cross-chain plan `fromToken = USDC_ETH`, 3 steps `["Swap","Bridge · to Polygon","EnterBasket · split across legs"]` — only if `opts.crossChain`, else `{ supported:false }`.
- `8453` → same as `1` but `fromToken = USDC_BASE`.
- any other / `undefined` → `{ supported:false }`.

USDC source-token constants (native USDC per chain) move into this module (or are imported), so the sheet
no longer hard-codes them.

### 3.2 `lib/lifi/enter.ts` *(modify)*

`buildEnterQuote` sets the destination token by mode: **same-chain → `toToken: ADDR.usdce`** (LI.FI performs
the verified native-USDC → USDC.e swap that every `contractCall` consumes); **cross-chain → unchanged**
(`toToken: ADDR.usdcNative`, the unverified stretch path is left as-is). `toChain` stays `137` in both.

> **Verification gate (implementation):** before finalizing, confirm against a live LI.FI
> `get-quote-with-calls` (MCP) that same-chain `137→137` with `fromToken = native USDC`,
> `toToken = USDC.e`, and the real `contractCalls` builds a valid Composer quote (executor
> `0x2dfaDAB8266483beD9Fd9A292Ce56596a2D1378D`). If the verified shape needs `toToken = native USDC` with an
> internal swap instead, match that and adjust the test. The pinned fact "4 same-chain USDC→USDC.e routes
> exist" points at `toToken: USDC.e`.

### 3.3 `components/EnterSheet.tsx` *(modify)*

- Compute `const plan = planEntry(chainId, { crossChain: CROSSCHAIN_FLAG })` once per render.
- `onSupportedChain = "mode" in plan`. The wrong-chain Connect branch shows "Switch to Polygon" by default
  (`switchChain({ chainId: 137 })`); with the flag on it still offers Base.
- `chips` state is sized to `plan.steps.length` (2 or 3), not a fixed 3-tuple. Step 3 renders
  `plan.steps.map(...)`; the `updateRouteHook` progress mapping counts completed steps generically
  (`done >= i+1`) instead of assuming exactly three.
- `sign()` reads `fromChainId`/`fromToken` from `plan` (no more `chainId === 1 ? USDC_ETH : USDC_BASE`).
- Connect-step copy: default "Connect on **Polygon**" / flag-on "Connect on **Polygon, Ethereum, or Base**".
- The Result step's Polygonscan links and the standalone Uniswap evidence block are unchanged.

### 3.4 Feature flag

`NEXT_PUBLIC_ENABLE_CROSSCHAIN_ENTRY` — read once as a module constant
(`process.env.NEXT_PUBLIC_ENABLE_CROSSCHAIN_ENTRY === "true"`). Absent/false ⇒ Polygon-only.

## 4. Data flow (same-chain demo spine)

Wallet on Polygon with native USDC → `POST /api/basket-entry` returns `contractCalls` (real Uniswap `/quote`
slippage floors, server-only key) → `buildEnterQuote({ fromChainId:137, fromToken: nativeUSDC, toToken:
USDC.e, contractCalls })` → **one signature** → LI.FI swaps native USDC→USDC.e and fans the deposit →
`enterPredictionLeg`×N (neutral YES+NO sets) + `enterAssetLeg`×M (Uniswap `SwapRouter02`) → sets + sleeve
tokens land in the user's wallet → unified Arc NAV reflects them.

## 5. Error handling

- Unsupported chain → `planEntry` returns `{ supported:false }` → Connect step blocks with a "Switch to
  Polygon" CTA (no silent wrong-chain submit). Matches today's wrong-network guard, retargeted to 137.
- `sign()` keeps the existing try/catch → Result step "refund" branch with the error message; the deployed
  `EnterBasket` remains revert-safe (per-leg `minOut` floor + USDC.e refund). No change to that contract.
- API-route input validation (400/404/502) and the "refuse to ship a 0-minOut swap" guard are unchanged.

## 6. Testing strategy (TDD where logic allows)

1. **`planEntry` (pure, RED→GREEN):** `137` → same-chain plan with 2 steps, `fromToken = ADDR.usdcNative`,
   no "Bridge" label; `1`/`8453` with `crossChain:true` → cross-chain plan, 3 steps, correct per-chain
   `fromToken`; `1`/`8453` with flag off → `{ supported:false }`; unknown/`undefined` → `{ supported:false }`.
2. **`buildEnterQuote` same-chain:** mocked `getContractCallsQuote` → request has `fromChain===137`,
   `toChain===137`, `toToken===ADDR.usdce`; cross-chain (1) request still `toToken===ADDR.usdcNative`.
3. **Not unit-tested (no headless browser):** the React chip render + connect/switch flow — covered by the
   `planEntry` unit tests plus a manual dev-server eyeball (`/theme/ai` renders, sheet opens, Connect shows
   "Switch to Polygon"). Live route execution is Task 9 (user-gated).
4. **Regression:** full `npx vitest run`, `npx tsc --noEmit`, `npm run build` (routes incl. `/api/basket-entry`).

## 7. Adjacent polish (same slice) — render every sleeve card

`app/theme/[slug]/page.tsx` currently renders only `assetLegs[0]`. Change the single asset-leg block to
`assetLegs.map(...)` over the existing card markup (monochrome ◆, `priceUsd`, weight). Pure visual fidelity
so the dashboard shows the full sleeve (e.g. AI = WETH + LINK); NAV/securities/Enter-sheet already cover all
legs. No new decision, follows the existing card pattern.

## 8. Out of scope (YAGNI)

Live LI.FI route execution; the Arc Paymaster/CCTP artifact (Task 3 research + Task 9 hand-off);
cross-chain re-verification or fixing the unverified stretch `toToken`; any `EnterBasket` redeploy; UniswapX
exit; globals.css token cleanup.
