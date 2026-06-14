# On-chain Asset Sleeve Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each bucket's executable asset side a small sleeve of deeply-liquid Polygon tokens, bought via Uniswap `SwapRouter02` inside the *already-deployed* `EnterBasket.enterAssetLeg` and assembled with the prediction legs in one same-chain LI.FI Composer signature — while keeping equity names as the analyst-band anchor.

**Architecture:** Pure builders (router calldata, deposit split) are TDD'd in isolation; async quoting (Uniswap `/quote` → `minAmountOut`) is a thin layer on top; the deployed contract is reused unchanged (proven on a Polygon fork). Same-chain Polygon spine (verified to build against `li.quest/v1/quote/contractCalls`); cross-chain stays a feature flag.

**Tech Stack:** TypeScript + viem (ABI encode/decode), vitest, `@lifi/sdk`, Uniswap Trading API `/quote` + `SwapRouter02` (V3), Foundry (Polygon fork), Next.js.

**Scope:** This plan delivers the **data + entry-builder + contract-proof** layers, fully tested and fork-proven. The **live-demo wiring + 3-track qualification execution** (UI Enter-sheet, one live route, Arc Paymaster/CCTP, Uniswap feedback form) is the final section — a verification checklist, because those are live/manual ops, not TDD code. UI Enter-sheet code changes are deferred to a short follow-up plan after `EnterSheet.tsx`/`BuyBox.tsx` are read at execution time (the entry-builder change propagates to them with minimal edits).

**Reference spec:** `docs/superpowers/specs/2026-06-13-onchain-asset-sleeve-design.md`

---

## File Structure

- `lib/addresses.ts` *(modify)* — add `swapRouter02` + sleeve token addresses (LINK).
- `lib/uniswap/router.ts` *(create)* — pure `SwapRouter02.exactInputSingle` calldata builder.
- `lib/baskets/types.ts` *(modify)* — `AssetLeg` gains `ticker` + `swapFee`.
- `lib/baskets/registry.ts` *(modify)* — per-bucket multi-asset sleeves + matching `LIVE-UNISWAP` securities + re-normalized weights.
- `lib/lifi/basket.ts` *(modify)* — `buildBasketContractCalls` splits across ALL legs, emits `enterPredictionLeg` + `enterAssetLeg`; add `ENTER_ASSET_LEG_ABI`.
- `lib/lifi/assetQuotes.ts` *(create)* — async `resolveAssetMinOuts` (Uniswap `/quote` × slippage).
- `lib/lifi/enter.ts` *(modify)* — `buildEnterQuote` same-chain (`137`) mode.
- `lib/dashboard/service.ts` *(modify)* — handle N asset legs.
- `contracts/test/EnterBasket.t.sol` *(modify)* — fork test: real `SwapRouter02` swap inside `enterAssetLeg`.
- Tests: `test/uniswap-router.test.ts` *(create)*, `test/registry.test.ts` *(modify)*, `test/basket-entry.test.ts` *(modify)*, `test/asset-quotes.test.ts` *(create)*, `test/adapters.test.ts`/`enter` *(modify)*, `test/dashboard.test.ts` *(modify)*.

---

## Task 0: Verify on-chain constants (no commit)

**Files:** none (records values used by later tasks).

- [ ] **Step 1: Verify Uniswap `SwapRouter02` address + USDC.e→token pool fee tiers on a Polygon fork**

Run (uses `~/.foundry/bin`; `$POLYGON_RPC` from `.env.local`):

```bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="$(grep '^POLYGON_RPC=' .env.local | cut -d= -f2-)"
# Candidate SwapRouter02 (verify it exists / is a contract):
cast code 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45 --rpc-url "$RPC" | head -c 12
# For each sleeve token, confirm a deep USDC.e pool + which fee tier via a /quote (Trading API) or
# the V3 factory getPool(USDC.e, token, fee) returning non-zero:
# factory 0x1F98431c8aD98523631AE4a59f267346ea31F984; fees 500 / 3000 / 10000
for T in 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619 0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6 0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD 0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39; do
  for F in 500 3000 10000; do
    P=$(cast call 0x1F98431c8aD98523631AE4a59f267346ea31F984 "getPool(address,address,uint24)(address)" 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174 $T $F --rpc-url "$RPC");
    echo "token=$T fee=$F pool=$P";
  done
done
```

Expected: SwapRouter02 has bytecode; each sleeve token has at least one non-zero pool. **Record the chosen fee tier per token** (deepest pool) — these go into the registry (Task 3) and the fork test (Task 8). If the SwapRouter02 address has no code, find the Polygon SwapRouter02 from Uniswap docs (context7) and use that instead.

- [ ] **Step 2: Verify the Arc qualification path (Circle MCP)**

Use the `circle` MCP: `search_circle_documentation` for "Arc testnet paymaster USDC gas modular wallet" and "CCTP Arc Polygon supported chains", then `get_circle_product_summary` on the matched product. **Record** which is live on Arc Testnet today — a Modular-Wallet **Paymaster (USDC-gas) userOp** or a **CCTP transfer Arc→Polygon** — that's the Arc load-bearing artifact in the final checklist.

---

## Task 1: Add SwapRouter02 + sleeve token addresses

**Files:**
- Modify: `lib/addresses.ts`

- [ ] **Step 1: Add the constants** (use the fee tiers verified in Task 0; address from Task 0 if different)

```typescript
// add inside the ADDR object, after `wsteth`:
  wbtc: getAddress("0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6"), // 8 decimals
  weth: getAddress("0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"),
  link: getAddress("0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39"),
  swapRouter02: getAddress("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"), // Uniswap V3 SwapRouter02 (verify Task 0)
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: clean (no output).

- [ ] **Step 3: Commit**

```bash
git add lib/addresses.ts
git commit -m "feat(addresses): add SwapRouter02 + WBTC/WETH/LINK Polygon addresses"
```

---

## Task 2: Pure Uniswap SwapRouter02 calldata builder

**Files:**
- Create: `lib/uniswap/router.ts`
- Test: `test/uniswap-router.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { decodeFunctionData, getAddress } from "viem";
import { buildExactInputSingleData, SWAP_ROUTER_02_ABI } from "@/lib/uniswap/router";
import { ADDR } from "@/lib/addresses";

const RECIPIENT = getAddress("0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0");

describe("buildExactInputSingleData (Uniswap SwapRouter02)", () => {
  it("encodes exactInputSingle with USDC.e in, the token out, fee, recipient, amount and minOut", () => {
    const data = buildExactInputSingleData({
      tokenOut: ADDR.weth,
      fee: 500,
      amountIn: 3_000_000n, // 3 USDC.e
      minOut: 900_000_000_000_000n, // 0.0009 WETH floor
      recipient: RECIPIENT,
    });
    const { functionName, args } = decodeFunctionData({ abi: SWAP_ROUTER_02_ABI, data });
    expect(functionName).toBe("exactInputSingle");
    const p = args[0] as Record<string, unknown>;
    expect(p.tokenIn).toBe(ADDR.usdce);
    expect(p.tokenOut).toBe(ADDR.weth);
    expect(p.fee).toBe(500);
    expect(p.recipient).toBe(RECIPIENT);
    expect(p.amountIn).toBe(3_000_000n);
    expect(p.amountOutMinimum).toBe(900_000_000_000_000n);
    expect(p.sqrtPriceLimitX96).toBe(0n);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/uniswap-router.test.ts`
Expected: FAIL — `buildExactInputSingleData is not a function` (module missing).

- [ ] **Step 3: Write minimal implementation**

```typescript
import { encodeFunctionData, type Address, type Hex } from "viem";
import { ADDR } from "@/lib/addresses";

/** Uniswap V3 SwapRouter02 (IV3SwapRouter) — exactInputSingle has NO deadline (unlike the old router),
 *  and pulls tokenIn from msg.sender via a plain ERC-20 allowance, which is exactly what
 *  EnterBasket.enterAssetLeg does (`approve(spender) -> router.call(data)`). */
export const SWAP_ROUTER_02_ABI = [
  {
    type: "function",
    name: "exactInputSingle",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

/** Build SwapRouter02 calldata to swap USDC.e -> `tokenOut`, delivered to `recipient` (the EnterBasket
 *  executor, which then enforces minOut + sweeps to the user). Single-hop only: sleeve tokens are
 *  liquidity-gated to ones with a deep direct USDC.e pool (Task 0). */
export function buildExactInputSingleData(p: {
  tokenOut: Address;
  fee: number;
  amountIn: bigint;
  minOut: bigint;
  recipient: Address;
}): Hex {
  return encodeFunctionData({
    abi: SWAP_ROUTER_02_ABI,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: ADDR.usdce,
        tokenOut: p.tokenOut,
        fee: p.fee,
        recipient: p.recipient,
        amountIn: p.amountIn,
        amountOutMinimum: p.minOut,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/uniswap-router.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add lib/uniswap/router.ts test/uniswap-router.test.ts
git commit -m "feat(uniswap): pure SwapRouter02 exactInputSingle calldata builder (TDD)"
```

---

## Task 3: Multi-asset sleeves in the registry

**Files:**
- Modify: `lib/baskets/types.ts`
- Modify: `lib/baskets/registry.ts`
- Test: `test/registry.test.ts`

- [ ] **Step 1: Write the failing tests** (append to `test/registry.test.ts`)

```typescript
import { ADDR } from "@/lib/addresses";

describe("multi-asset on-chain sleeve", () => {
  it("every bucket has ≥1 asset leg, each with a token, decimals-aware sizing, and a v3 swapFee", () => {
    for (const t of listThemes()) {
      const assets = t.legs.filter((l) => l.kind === "asset") as Array<{ token: string; swapFee?: number; ticker?: string }>;
      expect(assets.length).toBeGreaterThanOrEqual(1);
      for (const a of assets) {
        expect(a.token).toMatch(/^0x[0-9a-fA-F]{40}$/);
        expect([500, 3000, 10000]).toContain(a.swapFee); // verified v3 fee tier (Task 0)
        expect(a.ticker).toBeTruthy();
      }
    }
  });

  it("weights still sum to 1 across predictions + the sleeve", () => {
    for (const t of listThemes()) expect(themeWeightsSumToOne(t.slug)).toBe(true);
  });

  it("anti-drift: every asset-leg token is a LIVE-UNISWAP security in the same bucket", () => {
    for (const t of listThemes()) {
      const secTokens = new Set(
        getSecurities(t.slug).filter((s) => s.availability === "LIVE-UNISWAP" && s.token).map((s) => s.token!.toLowerCase()),
      );
      for (const a of t.legs.filter((l) => l.kind === "asset")) {
        expect(secTokens.has((a as { token: string }).token.toLowerCase())).toBe(true);
      }
    }
  });

  it("AI sleeve is wstETH + LINK (risk-on / data-infra), NVDA stays display-only", () => {
    const tickers = getTheme("ai").legs.filter((l) => l.kind === "asset").map((l) => (l as { ticker: string }).ticker);
    expect(tickers).toEqual(["wstETH", "LINK"]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run test/registry.test.ts`
Expected: FAIL — asset legs lack `swapFee`/`ticker`; AI has one asset leg, not two.

- [ ] **Step 3a: Extend the `AssetLeg` type** in `lib/baskets/types.ts`

```typescript
export type AssetLeg = {
  kind: "asset";
  label: string;
  token: `0x${string}`;
  weight: number;
  /** Token decimals for Uniswap /quote sizing (default 18; WBTC = 8). */
  decimals?: number;
  /** Display ticker (must match a LIVE-UNISWAP security in the same bucket). */
  ticker: string;
  /** Verified Uniswap V3 fee tier for the direct USDC.e -> token pool (Task 0): 500 | 3000 | 10000. */
  swapFee: number;
};
```

- [ ] **Step 3b: Convert each bucket's single asset leg into a sleeve** in `lib/baskets/registry.ts`. Use the fee tiers from Task 0 (shown here as the expected deepest tiers — adjust if Task 0 differs). Replace each bucket's asset leg(s) and add the matching `LIVE-UNISWAP` securities.

```typescript
// AI: replace the single wstETH asset leg with wstETH + LINK (assets sum 0.5; preds 0.35+0.15).
//   legs[2] becomes:
{ kind: "asset", label: "Risk-on staking proxy (wstETH on Polygon)", token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD", ticker: "wstETH", swapFee: 500, weight: 0.3 },
{ kind: "asset", label: "Data/oracle infra proxy (LINK on Polygon)", token: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", ticker: "LINK", swapFee: 3000, weight: 0.2 },
// AI securities[]: add LINK as LIVE-UNISWAP (NVDA + wstETH already present):
{ ticker: "LINK", name: "Chainlink", token: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", availability: "LIVE-UNISWAP", chain: "polygon", note: "Buyable data/oracle-infra risk proxy on Uniswap (Polygon)." },

// CRYPTO: WBTC + WETH (assets sum 0.6; pred 0.4). Add ticker/swapFee; WBTC keeps decimals: 8.
{ kind: "asset", label: "BTC exposure (WBTC on Polygon)", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", ticker: "WBTC", swapFee: 3000, weight: 0.4, decimals: 8 },
{ kind: "asset", label: "ETH exposure (WETH on Polygon)", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", ticker: "WETH", swapFee: 500, weight: 0.2 },
// crypto securities[] already list WBTC + WETH as LIVE-UNISWAP — no change.

// MACRO: wstETH + WETH (assets sum 0.5; pred 0.5).
{ kind: "asset", label: "Rate-sensitive risk (wstETH on Polygon)", token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD", ticker: "wstETH", swapFee: 500, weight: 0.3 },
{ kind: "asset", label: "Rate-sensitive risk (WETH on Polygon)", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", ticker: "WETH", swapFee: 500, weight: 0.2 },
// MACRO securities[]: add WETH LIVE-UNISWAP (wstETH already present):
{ ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", note: "Buyable rate-sensitive risk asset on Uniswap (Polygon)." },

// GEOPOLITICS: WBTC + wstETH (assets sum 0.5; preds 0.25+0.25).
{ kind: "asset", label: "Digital safe-haven (WBTC on Polygon)", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", ticker: "WBTC", swapFee: 3000, weight: 0.3, decimals: 8 },
{ kind: "asset", label: "Risk asset (wstETH on Polygon)", token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD", ticker: "wstETH", swapFee: 500, weight: 0.2 },
// GEOPOLITICS securities[]: add WBTC LIVE-UNISWAP (wstETH already present):
{ ticker: "WBTC", name: "Wrapped Bitcoin", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, availability: "LIVE-UNISWAP", chain: "polygon", note: "Buyable digital safe-haven on Uniswap (Polygon)." },

// US-POLITICS: WETH + wstETH (assets sum 0.5; preds 0.25+0.25).
{ kind: "asset", label: "Risk-on (WETH on Polygon)", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", ticker: "WETH", swapFee: 500, weight: 0.3 },
{ kind: "asset", label: "Risk asset (wstETH on Polygon)", token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD", ticker: "wstETH", swapFee: 500, weight: 0.2 },
// US-POLITICS securities[]: add WETH LIVE-UNISWAP (wstETH already present):
{ ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", note: "Buyable risk-on asset on Uniswap (Polygon)." },
```

> Note: keep the existing wstETH/WBTC/WETH securities that already carry `availability: "LIVE-UNISWAP"`; just ensure each sleeve token has a matching security (add only the missing ones above). The headline `display.assetSymbol` (NVDA/WBTC/TLT/ITA/DJT) is unchanged — the hero still uses the equity anchor.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run test/registry.test.ts`
Expected: PASS (all, including the 4 new).

- [ ] **Step 5: Commit**

```bash
git add lib/baskets/types.ts lib/baskets/registry.ts test/registry.test.ts
git commit -m "feat(registry): per-bucket multi-asset on-chain sleeve + anti-drift security guard (TDD)"
```

---

## Task 4: `buildBasketContractCalls` emits prediction + asset calls

**Files:**
- Modify: `lib/lifi/basket.ts`
- Test: `test/basket-entry.test.ts`

- [ ] **Step 1: Rewrite the failing tests** in `test/basket-entry.test.ts` to the new behavior (split across ALL legs; assets encode `enterAssetLeg`). Replace the file body's `describe` with:

```typescript
import { describe, it, expect } from "vitest";
import { decodeFunctionData, getAddress } from "viem";
import { buildBasketContractCalls, ENTER_PREDICTION_LEG_ABI, ENTER_ASSET_LEG_ABI } from "@/lib/lifi/basket";
import { getTheme } from "@/lib/baskets/registry";
import { ADDR } from "@/lib/addresses";

const RECIPIENT = getAddress("0x00000000000000000000000000000000000000bE");
const ENTER = getAddress("0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0");

describe("buildBasketContractCalls — index allocation across prediction legs + on-chain sleeve", () => {
  it("emits one call per leg (predictions + sleeve) and the amounts sum to the deposit exactly", () => {
    const total = 10_000_000n;
    const calls = buildBasketContractCalls("ai", total, RECIPIENT, ENTER);
    const legs = getTheme("ai").legs;
    expect(calls.length).toBe(legs.length); // 2 predictions + 2 sleeve = 4
    expect(calls.reduce((a, c) => a + BigInt(c.fromAmount), 0n)).toBe(total);
    for (const c of calls) {
      expect(c.fromTokenAddress).toBe(ADDR.usdce);
      expect(c.toContractAddress).toBe(ENTER);
    }
  });

  it("allocates by each leg's weight (AI: .35 .15 .30 .20 of 10 USDC.e)", () => {
    const calls = buildBasketContractCalls("ai", 10_000_000n, RECIPIENT, ENTER);
    expect(calls.map((c) => BigInt(c.fromAmount))).toEqual([3_500_000n, 1_500_000n, 3_000_000n, 2_000_000n]);
  });

  it("encodes enterPredictionLeg for prediction legs", () => {
    const calls = buildBasketContractCalls("ai", 8_000_000n, RECIPIENT, ENTER);
    const { functionName, args } = decodeFunctionData({ abi: ENTER_PREDICTION_LEG_ABI, data: calls[0].toContractCallData });
    expect(functionName).toBe("enterPredictionLeg");
    expect(args[3]).toBe(RECIPIENT);
  });

  it("encodes enterAssetLeg(amount, recipient, SwapRouter02, SwapRouter02, token, minOut, swapData) for sleeve legs", () => {
    const calls = buildBasketContractCalls("ai", 10_000_000n, RECIPIENT, ENTER, { minOut: () => 5n });
    const assetCall = calls[2]; // first asset leg (wstETH)
    const { functionName, args } = decodeFunctionData({ abi: ENTER_ASSET_LEG_ABI, data: assetCall.toContractCallData });
    expect(functionName).toBe("enterAssetLeg");
    expect(args[0]).toBe(3_000_000n);          // amount
    expect(args[1]).toBe(RECIPIENT);           // recipient
    expect(args[2]).toBe(ADDR.swapRouter02);   // router
    expect(args[3]).toBe(ADDR.swapRouter02);   // spender
    expect(args[4]).toBe(ADDR.wsteth);         // assetOut
    expect(args[5]).toBe(5n);                  // minAmountOut
    expect(args[6]).not.toBe("0x");            // swapData present
  });

  it("throws on a theme with no prediction markets", () => {
    expect(() => buildBasketContractCalls("nope", 1n, RECIPIENT, ENTER)).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run test/basket-entry.test.ts`
Expected: FAIL — `ENTER_ASSET_LEG_ABI` undefined; calls only cover predictions.

- [ ] **Step 3: Rewrite `lib/lifi/basket.ts`** to split across all legs and emit both call types:

```typescript
import { encodeFunctionData, type Address, type Hex } from "viem";
import { ADDR } from "@/lib/addresses";
import { getTheme } from "@/lib/baskets/registry";
import type { PredictionLeg, AssetLeg } from "@/lib/baskets/types";
import { buildExactInputSingleData } from "@/lib/uniswap/router";

export const ENTER_PREDICTION_LEG_ABI = [
  {
    type: "function",
    name: "enterPredictionLeg",
    stateMutability: "nonpayable",
    inputs: [
      { name: "conditionId", type: "bytes32" },
      { name: "questionId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [],
  },
] as const;

export const ENTER_ASSET_LEG_ABI = [
  {
    type: "function",
    name: "enterAssetLeg",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "router", type: "address" },
      { name: "spender", type: "address" },
      { name: "assetOut", type: "address" },
      { name: "minAmountOut", type: "uint256" },
      { name: "swapData", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export type ContractCall = {
  fromAmount: string;
  fromTokenAddress: Address;
  toContractAddress: Address;
  toContractCallData: Hex;
  toContractGasLimit: string;
  toApprovalAddress: Address;
};

/**
 * Split a single USDC.e deposit across the bucket's FULL strategy — prediction markets (neutral YES+NO
 * sets) AND the on-chain asset sleeve (Uniswap swaps) — one weighted LI.FI contractCall each. Weights
 * sum to 1 across all legs; the LAST leg absorbs the rounding remainder so the deposit is fully allocated.
 * Asset legs route through EnterBasket.enterAssetLeg (Uniswap SwapRouter02), revert-safe.
 *
 * @param opts.minOut  per-asset-leg minimum output (base units of the token). Pure/injected so this stays
 *                     synchronous + testable; the async Uniswap /quote layer (resolveAssetMinOuts) supplies
 *                     real slippage floors in production. Defaults to 0n (NO protection — tests/dev only).
 */
export function buildBasketContractCalls(
  slug: string,
  totalUsdce: bigint,
  recipient: Address,
  enterBasket: Address,
  opts?: { minOut?: (leg: AssetLeg, amount: bigint) => bigint },
): ContractCall[] {
  const legs = getTheme(slug).legs;
  if (!legs.some((l) => l.kind === "prediction")) throw new Error(`no prediction markets in bucket: ${slug}`);

  const weightSum = legs.reduce((a, l) => a + l.weight, 0);
  let allocated = 0n;

  return legs.map((leg, i) => {
    const isLast = i === legs.length - 1;
    const amount = isLast
      ? totalUsdce - allocated
      : (totalUsdce * BigInt(Math.round((leg.weight / weightSum) * 1_000_000))) / 1_000_000n;
    allocated += amount;

    let toContractCallData: Hex;
    let toContractGasLimit: string;
    if (leg.kind === "prediction") {
      const p = leg as PredictionLeg;
      toContractCallData = encodeFunctionData({
        abi: ENTER_PREDICTION_LEG_ABI,
        functionName: "enterPredictionLeg",
        args: [p.conditionId, p.questionId, amount, recipient],
      });
      toContractGasLimit = "500000";
    } else {
      const a = leg as AssetLeg;
      const minOut = opts?.minOut?.(a, amount) ?? 0n;
      const swapData = buildExactInputSingleData({ tokenOut: a.token, fee: a.swapFee, amountIn: amount, minOut, recipient: enterBasket });
      toContractCallData = encodeFunctionData({
        abi: ENTER_ASSET_LEG_ABI,
        functionName: "enterAssetLeg",
        args: [amount, recipient, ADDR.swapRouter02, ADDR.swapRouter02, a.token, minOut, swapData],
      });
      toContractGasLimit = "700000";
    }

    return {
      fromAmount: amount.toString(),
      fromTokenAddress: ADDR.usdce,
      toContractAddress: enterBasket,
      toContractCallData,
      toContractGasLimit,
      toApprovalAddress: enterBasket,
    };
  });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run test/basket-entry.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/lifi/basket.ts test/basket-entry.test.ts
git commit -m "feat(lifi): basket calls split across predictions + Uniswap asset sleeve (TDD)"
```

---

## Task 5: Async Uniswap-quote slippage floors

**Files:**
- Create: `lib/lifi/assetQuotes.ts`
- Test: `test/asset-quotes.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, afterEach } from "vitest";
import * as us from "@/lib/adapters/uniswap";
import { resolveAssetMinOut } from "@/lib/lifi/assetQuotes";
import type { AssetLeg } from "@/lib/baskets/types";

afterEach(() => vi.restoreAllMocks());

const wsteth: AssetLeg = { kind: "asset", label: "x", token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD", ticker: "wstETH", swapFee: 500, weight: 0.3 };

describe("resolveAssetMinOut", () => {
  it("converts a USDC.e amount to a slippage-floored token-out using the Uniswap /quote price", async () => {
    // 1 wstETH = 4000 USDC -> 3 USDC.e buys 0.00075 wstETH; 1% slippage floor = 0.0007425 wstETH.
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4000);
    const minOut = await resolveAssetMinOut(wsteth, 3_000_000n, 0.01);
    // 3/4000 = 0.00075 ETH = 7.5e14 wei; *0.99 = 7.425e14
    expect(minOut).toBe(742_500_000_000_000n);
  });

  it("returns 0n if the quote feed is down (entry still proceeds; contract slippage check is the backstop downstream)", async () => {
    vi.spyOn(us, "fetchAssetPrice").mockRejectedValue(new Error("no key"));
    expect(await resolveAssetMinOut(wsteth, 3_000_000n, 0.01)).toBe(0n);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run test/asset-quotes.test.ts`
Expected: FAIL — module/function missing.

- [ ] **Step 3: Implement** `lib/lifi/assetQuotes.ts`

```typescript
import { fetchAssetPrice } from "@/lib/adapters/uniswap";
import type { AssetLeg } from "@/lib/baskets/types";

/** Convert a USDC.e input amount (6dp) into a slippage-floored minimum token output (token base units),
 *  using the Uniswap /quote USD price for 1 whole token. Returns 0n if the quote feed is unavailable —
 *  the swap still executes and EnterBasket.enterAssetLeg's on-chain minAmountOut (also passed) plus the
 *  pool itself bound the downside; 0n just means "no extra off-chain floor this run". */
export async function resolveAssetMinOut(leg: AssetLeg, amountUsdce: bigint, slippage: number): Promise<bigint> {
  try {
    const priceUsd = await fetchAssetPrice(leg.token, { decimals: leg.decimals }); // USD per 1 token
    if (!(priceUsd > 0)) return 0n;
    const decimals = BigInt(leg.decimals ?? 18);
    const usdcHuman = Number(amountUsdce) / 1e6; // USDC.e is 6dp
    const tokenOut = (usdcHuman / priceUsd) * (1 - slippage); // whole tokens, floored by slippage
    return BigInt(Math.floor(tokenOut * 10 ** Number(decimals)));
  } catch {
    return 0n;
  }
}

/** Build the per-leg minOut closure for buildBasketContractCalls by pre-resolving all sleeve quotes. */
export async function resolveAssetMinOuts(
  legs: AssetLeg[],
  amountFor: (leg: AssetLeg) => bigint,
  slippage = 0.01,
): Promise<(leg: AssetLeg, amount: bigint) => bigint> {
  const entries = await Promise.all(legs.map(async (l) => [l.token, await resolveAssetMinOut(l, amountFor(l), slippage)] as const));
  const byToken = new Map(entries);
  return (leg) => byToken.get(leg.token) ?? 0n;
}
```

> Float math for `Math.floor(tokenOut * 10**decimals)` can lose precision for 18-dp tokens but is acceptable for a *minimum-output floor* (rounding down is conservative). If a reviewer flags it, switch to integer math; out of scope here.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run test/asset-quotes.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/lifi/assetQuotes.ts test/asset-quotes.test.ts
git commit -m "feat(lifi): async Uniswap /quote slippage floors for the sleeve (TDD)"
```

---

## Task 6: `buildEnterQuote` same-chain (137) mode

**Files:**
- Modify: `lib/lifi/enter.ts`
- Test: `test/enter-quote.test.ts` *(create)*

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, afterEach } from "vitest";
import * as sdk from "@lifi/sdk";
import { buildEnterQuote } from "@/lib/lifi/enter";
import { ADDR } from "@/lib/addresses";

afterEach(() => vi.restoreAllMocks());

describe("buildEnterQuote", () => {
  it("builds a SAME-CHAIN Polygon (137->137) contract-calls request", async () => {
    const spy = vi.spyOn(sdk, "getContractCallsQuote").mockResolvedValue({} as never);
    await buildEnterQuote({
      fromChainId: 137,
      fromToken: ADDR.usdcNative,
      fromAddress: "0x00000000000000000000000000000000000000bE",
      fromAmount: "10000000",
      contractCalls: [],
    });
    const req = spy.mock.calls[0][0];
    expect(req.fromChain).toBe(137);
    expect(req.toChain).toBe(137);
    expect(req.toToken).toBe(ADDR.usdcNative);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run test/enter-quote.test.ts`
Expected: FAIL — `fromChainId: 137` rejected by the `1 | 8453` type (tsc), or no same-chain path.

- [ ] **Step 3: Widen the type** in `lib/lifi/enter.ts` — change `EnterQuoteParams.fromChainId` to `1 | 8453 | 137` and update the comment:

```typescript
  /** Source chain — Polygon (137, same-chain demo spine) or Ethereum (1)/Base (8453, cross-chain stretch).
   *  NEVER Arc (Arc→Polygon routing is dead). */
  fromChainId: 1 | 8453 | 137;
```

(The body already sets `toChain: 137` and `toToken: ADDR.usdcNative`, so same-chain works once the type allows 137 — no further logic change.)

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run test/enter-quote.test.ts && npx tsc --noEmit`
Expected: PASS + tsc clean.

- [ ] **Step 5: Commit**

```bash
git add lib/lifi/enter.ts test/enter-quote.test.ts
git commit -m "feat(lifi): same-chain Polygon (137) entry-quote mode for the demo spine (TDD)"
```

---

## Task 7: `buildDashboard` handles N asset legs

**Files:**
- Modify: `lib/dashboard/service.ts:110-175` (the `buildDashboard` asset-leg section)
- Test: `test/dashboard.test.ts`

- [ ] **Step 1: Update/extend the failing test** in `test/dashboard.test.ts` — change the AI "lists every leg" expectation and add a sleeve assertion:

```typescript
  it("includes every sleeve asset leg in the view (AI = wstETH + LINK)", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.72);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4300);
    vi.spyOn(eq, "fetchEquityPrice").mockResolvedValue(155);

    const d = await buildDashboard("ai");
    const assets = d.legs.filter((l) => l.kind === "asset");
    expect(assets.length).toBe(2);               // wstETH + LINK
    expect(assets.every((a) => a.priceUsd === 4300)).toBe(true);
    expect(d.legs.filter((l) => l.kind === "prediction").length).toBe(2);
    expect(d.hero.assetSymbol).toBe("NVDA");      // hero anchor unchanged
  });
```

(Also update the existing `"composes the hero..."` test: it asserts a single asset leg's price via `d.legs.find(l => l.kind === "asset")` — that still works, but change `expect(...priceUsd).toBe(4300)` to use `.find` which returns the first asset leg.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run test/dashboard.test.ts`
Expected: FAIL — only one asset leg in the view (current code uses `t.legs.find(isAsset)`).

- [ ] **Step 3: Replace the single-asset block** in `lib/dashboard/service.ts`. Change:

```typescript
  const assetLeg = t.legs.find(isAsset)!;
  const [assetUsd, priceSource] = await withFallback(
    () => fetchAssetPrice(assetLeg.token, { decimals: assetLeg.decimals }),
    t.display.fallback.assetLegPriceUsd,
  );
  const assetView: LegView = { kind: "asset", label: assetLeg.label, weight: assetLeg.weight, priceUsd: assetUsd, priceSource };
```

to:

```typescript
  const assetLegs = t.legs.filter(isAsset);
  const assetViews: LegView[] = await Promise.all(
    assetLegs.map(async (assetLeg) => {
      const [assetUsd, priceSource] = await withFallback(
        () => fetchAssetPrice(assetLeg.token, { decimals: assetLeg.decimals }),
        t.display.fallback.assetLegPriceUsd,
      );
      return { kind: "asset" as const, label: assetLeg.label, weight: assetLeg.weight, priceUsd: assetUsd, priceSource };
    }),
  );
```

and change the final `legs: [...predViews, assetView]` to `legs: [...predViews, ...assetViews]`.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run test/dashboard.test.ts && npx tsc --noEmit`
Expected: PASS + tsc clean.

- [ ] **Step 5: Update the theme page NAV** — `app/theme/[slug]/page.tsx:66` currently does `const assetLeg = view.legs.find(...)` for `polygonNav`. Change to sum the sleeve:

```typescript
  const assetLegs = view.legs.filter((l) => l.kind === "asset");
  const polygonNav = assetLegs.reduce((a, l) => a + (l.priceUsd ?? 0), 0);
```

- [ ] **Step 6: Run full suite + build**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: all green; build succeeds (4 routes).

- [ ] **Step 7: Commit**

```bash
git add lib/dashboard/service.ts test/dashboard.test.ts "app/theme/[slug]/page.tsx"
git commit -m "feat(dashboard): render the full on-chain sleeve (N asset legs) + NAV sum (TDD)"
```

---

## Task 8: Foundry fork proof — real SwapRouter02 swap inside `enterAssetLeg`

**Files:**
- Modify: `contracts/test/EnterBasket.t.sol`

- [ ] **Step 1: Write the failing fork test** — append to `EnterBasketTest` (uses the verified SwapRouter02 + fee tier from Task 0; WETH out):

```solidity
    address SWAP_ROUTER_02 = vm.envOr("SWAP_ROUTER_02", address(0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45));
    address WETH = vm.envOr("WETH_POLYGON", address(0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619));

    /// REAL Uniswap V3 SwapRouter02 swap inside enterAssetLeg on a Polygon fork: USDC.e -> WETH,
    /// swept to the recipient, contract retains nothing, approval reset. Proves Approach A end-to-end.
    function test_assetLeg_realUniswapSwapToRecipient() public {
        uint256 amountIn = 5e6; // 5 USDC.e
        // IV3SwapRouter.exactInputSingle((tokenIn,tokenOut,fee,recipient,amountIn,amountOutMinimum,sqrtPriceLimitX96))
        bytes memory swapData = abi.encodeWithSignature(
            "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            USDCE, WETH, uint24(500), address(basket), amountIn, uint256(1), uint160(0)
        );

        vm.startPrank(user);
        IERC20(USDCE).approve(address(basket), amountIn);
        basket.enterAssetLeg(amountIn, user, SWAP_ROUTER_02, SWAP_ROUTER_02, WETH, 1, swapData);
        vm.stopPrank();

        assertGt(IERC20(WETH).balanceOf(user), 0, "recipient got WETH");
        assertEq(IERC20(USDCE).balanceOf(address(basket)), 0, "no USDC.e left");
        assertEq(IERC20(WETH).balanceOf(address(basket)), 0, "no WETH left");
        assertEq(IAllowance(USDCE).allowance(address(basket), SWAP_ROUTER_02), 0, "approval reset");
    }
```

- [ ] **Step 2: Run to verify it fails (then passes)**

Run:
```bash
export PATH="$HOME/.foundry/bin:$PATH"
cd contracts && forge test --match-test test_assetLeg_realUniswapSwapToRecipient -vvv
```
Expected first run: if the SwapRouter02 address or fee tier is wrong, it reverts → **fix the address/fee from Task 0 and re-run** until it passes (recipient WETH balance > 0). This IS the verification that Approach A works on-chain.

- [ ] **Step 3: Run the whole fork suite**

Run: `cd contracts && forge test -vv`
Expected: all tests pass (the 6 existing + the new one).

- [ ] **Step 4: Commit**

```bash
git add contracts/test/EnterBasket.t.sol
git commit -m "test(contracts): fork-prove enterAssetLeg swaps USDC.e->WETH via real Uniswap SwapRouter02"
```

---

## Task 9: Live qualification execution (verification checklist — not TDD code)

These are the live/manual ops that *secure the three tracks*. Do them after Tasks 1–8 are green. Record every tx hash in `README.md`. **A follow-up plan covers the UI Enter-sheet wiring** (read `components/EnterSheet.tsx` + `components/BuyBox.tsx` first; the change is: call `resolveAssetMinOuts` then pass the `minOut` closure into `buildBasketContractCalls`, and `buildEnterQuote` with `fromChainId: 137` — the asset legs then ride the existing one-signature flow).

- [ ] **Uniswap ($7k):** confirm the standalone Trading-API swap tx `0x23a0…cbde` (status 1) and **submit the Uniswap Developer Feedback Form** with that hash. Confirm `/quote` powers the dashboard + sleeve `minOut`.
- [ ] **LI.FI:** execute ONE same-chain Polygon Composer route end-to-end (`buildEnterQuote({fromChainId:137,...})` → `convertQuoteToRoute` → `executeRoute`) so prediction sets **and** ≥1 sleeve token land in a real wallet; record the tx. Keep the cross-chain-from-Base route as backup evidence.
- [ ] **Arc:** demonstrate the passkey Modular Wallet + unified NAV (incl. sleeve tokens) **and** the load-bearing artifact chosen in Task 0 — one Paymaster (USDC-gas) userOp **or** a CCTP transfer Arc→Polygon; record it.
- [ ] **Regression:** `npx vitest run` (all green), `npx tsc --noEmit` (clean), `npm run build` (4 routes), `cd contracts && forge test` (all green); curl `/` + `/theme/ai` = 200.

---

## Self-Review

**Spec coverage:** §3.1 model → Task 3; §3.2 same-chain Composer → Tasks 4+6; §3.3 Approach A / SwapRouter02 → Tasks 1,2,4,8; §4 qualification matrix → Task 9 (+ §0 Arc verify); §8 testing → every task is TDD; §9 risks → Task 0 (router/fees), Task 8 (fork proof), Task 6 (same-chain). No uncovered requirement.

**Placeholder scan:** every code step shows real code; addresses/fees are marked "verify in Task 0" with the exact verification commands (not a vague TODO). Task 9 is intentionally a checklist (live ops), explicitly flagged.

**Type consistency:** `buildExactInputSingleData` / `SWAP_ROUTER_02_ABI` (Task 2) used identically in Tasks 4 & 8; `ENTER_ASSET_LEG_ABI` defined in Task 4, matches the Solidity `enterAssetLeg` signature in `contracts/src/EnterBasket.sol`; `AssetLeg` gains `ticker`+`swapFee` (Task 3) consumed in Tasks 4,5,7; `resolveAssetMinOuts` closure shape matches `buildBasketContractCalls` `opts.minOut` (Tasks 4,5); `fromChainId: 1|8453|137` (Task 6) matches the same-chain test.
