# Design — Buyable on-chain asset sleeve + guaranteed 3-track qualification

**Date:** 2026-06-13 · **Status:** approved-direction, spec for review · **Branch:** `main`

## 1. Goal

Make the basket's asset side **buyable everywhere and delivered into the user's own wallet**, replacing the
reliance on geo-restricted single-name stocks for the *purchasable* leg — while **keeping the equity names as
the analyst-band anchor** for the "AI Sentiment Gap" hero. Above all: **100% qualify for Arc + LI.FI +
Uniswap**, with a live demo that works on stage.

## 2. Locked decisions (from brainstorming)

1. **Keep equity anchor + add buyable on-chain leg.** NVDA/TLT/ITA/DJT stay `DISPLAY-ONLY` Sentiment-Gap
   anchors (the "traditional" signal). The executable asset side becomes a real multi-asset on-chain sleeve.
2. **Same-chain Polygon spine, cross-chain as a feature-flagged stretch.** USDC already on Polygon (Arc/CCTP-
   funded) → one LI.FI Composer signature runs every leg on Polygon. No bridge → no fee-vs-fixed-amount revert.
   **Verified today:** `li.quest/v1/quote/contractCalls` builds a valid same-chain (137→137) Zap
   (executor `0x2dfaDAB8266483beD9Fd9A292Ce56596a2D1378D`); 4 same-chain USDC→USDC.e routes exist.
3. **Asset sleeve = per-bucket relevant, deeply-liquid Polygon tokens** (count driven by relevance, gated by
   liquidity). Bought via **Approach A**: `EnterBasket.enterAssetLeg` executing **Uniswap `SwapRouter02`**
   calldata, slippage-floored, swept to the user — revert-safe, **no contract redeploy**.

## 3. Architecture

### 3.1 Model change — multi-asset sleeve (`lib/baskets/`)

Today: N `prediction` legs + exactly one `asset` leg. New: **multiple `asset` legs** per bucket, each
`{ kind:"asset", token, decimals?, weight, ticker }`. The existing `themeWeightsSumToOne` invariant sums *all*
legs, so it holds unchanged (predictions + sleeve weights = 1).

**Anti-drift guard (new test):** every `asset` leg's `token` MUST also appear in that bucket's `securities[]`
as a `LIVE-UNISWAP` entry, and every `LIVE-UNISWAP` security with on-chain liquidity MUST be an asset leg —
so the display layer and the executable layer can never silently diverge. (Full unification of
`securities[]`↔`legs[]` is a possible later refactor; out of scope here — YAGNI.)

**Candidate liquid universe (Polygon, addresses to re-verify on-chain during impl):** WETH
`0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619`, WBTC `0x1BFD…BfD6` (8dp), wstETH `0x03b5…bCCD`, LINK
`0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39`, AAVE `0xD6DF932A45C0f255f85145f286eA0b292B21C90B`, UNI
`0xb33EaAd8d922B1083446DC23f610c2567fB5180f`. Only tokens with a confirmed deep USDC(.e) Uniswap-v3 pool ship.

**Proposed per-bucket sleeves (relevance × liquidity; weights illustrative, re-normalized with predictions):**

| Bucket | Sleeve (LIVE-UNISWAP, bought) | Display anchor (DISPLAY-ONLY) |
|---|---|---|
| AI | wstETH + LINK (risk-on / data-infra) | NVDA |
| Crypto | WBTC + WETH (+ UNI) — the asset *is* the theme | COIN |
| Macro & Fed | wstETH + WETH (rate-sensitive risk) | TLT, GLD |
| Geopolitics | WBTC + wstETH (digital safe-haven / risk) | ITA, LMT |
| US Politics | WETH + wstETH (risk-on) | DJT, GEO |

Sleeves are honestly framed as **risk-proxies** (the precise theme exposure lives in the equity anchor + the
prediction markets) — consistent with the existing non-US/EVM "no theme-perfect on-chain venue" model.

### 3.2 One-signature entry — same-chain LI.FI Composer (`lib/lifi/`)

`buildBasketContractCalls(slug, totalUsdce, recipient, enterBasket)` is extended to emit, in one quote:
- one `enterPredictionLeg(conditionId, questionId, amount, recipient)` call per market *(exists — Slice 4)*, **plus**
- one `enterAssetLeg(amount, recipient, router, spender, assetOut, minAmountOut, swapData)` call per sleeve token *(new)*.

`buildEnterQuote` gains a same-chain mode (`fromChainId: 137`, `fromToken: native USDC`, `toChain: 137`,
`toToken: USDC.e`); LI.FI Composer inserts the USDC→USDC.e swap then fans the deposit across every call. The
cross-chain mode (`fromChainId: 1|8453`) stays as a feature-flagged **stretch**.

### 3.3 Asset-leg execution — Approach A (Uniswap `SwapRouter02`)

For each sleeve token, `swapData` is **Uniswap `SwapRouter02.exactInput(path)`** (or `exactInputSingle`)
calldata with `recipient = EnterBasket`. The deployed contract's existing flow fits exactly: it
`usdce.approve(spender=SwapRouter02, amount)` → `router.call(swapData)` → checks `outBal >= minAmountOut`
→ sweeps the token (and any USDC.e dust) to the user; on swap failure it resets the approval and **refunds
USDC.e to the recipient** (revert-safe). `SwapRouter02` (not the Universal Router) because it pulls via a
plain ERC-20 allowance — what the contract already does — avoiding a Permit2 dance that would need a redeploy.

- **Pool path + fee tier per sleeve token** is curated + verified once (we control the small token set), so
  the calldata is deterministic. `minAmountOut` = Uniswap **`/quote`** output × (1 − slippage).
- **No redeploy:** `EnterBasket` (`0x5c36…E1d0`) already exposes `enterPredictionLeg` *and* `enterAssetLeg`.

## 4. Sponsor qualification matrix (the hard requirement)

Each track must have ≥1 concrete, demonstrable artifact. Items are **acceptance criteria**, not optional.

| Track | What earns it | Concrete artifact | Status | Acceptance test |
|---|---|---|---|---|
| **Uniswap — Best API Integration ($7k)** | Real **Trading API** use | (a) standalone `/quote`→`/swap`→Universal Router swap (recorded tx `0x23a0…cbde`); (b) `/quote` oracle powering dashboard + mindshare; (c) `/quote` for every sleeve leg's `minAmountOut`; (d) `SwapRouter02` acquires each sleeve asset on-chain | (a),(b) **done**; (c),(d) to build | Swap tx status 1 on Polygon; **submit Uniswap Developer Feedback Form** (required for $7k) |
| **LI.FI — Most Innovative Composer + Best UX** | One-signature Composer "zap" | Same-chain Polygon Composer quote with N prediction + M asset `contractCalls`, executed into a wallet; 4-step Enter sheet UX | same-chain Composer **builds (verified today)**; live execution to build | A real LI.FI route executes end-to-end on Polygon and tokens+sets land in the recipient wallet; cross-chain route is backup evidence |
| **Arc (Circle) — Target A + Target B** | Modular Wallet (passkey) + USDC + chain-abstracted NAV | Passkey Circle Modular Wallet on Arc Testnet; unified NAV across Arc + Polygon incl. the new sleeve tokens; **one Paymaster (USDC-gas) userOp OR a CCTP transfer Arc→Polygon** to make Arc load-bearing (not just display) | passkey + NAV **done**; Paymaster/CCTP to do | Wallet creates via passkey; NAV renders Arc USDC + Polygon basket; one USDC-gas userOp **or** CCTP transfer confirmed on-chain |

**Day-1 verifications (read-only MCP) before committing code:** ✅ LI.FI same-chain Composer (done) · ☐ Circle
docs: Arc Testnet Paymaster (USDC-gas) availability for Modular Wallets, and CCTP/Gateway Arc↔Polygon support
(pick whichever is live) · ☐ Uniswap `SwapRouter02` Polygon address + per-token pool/fee tiers (Tenderly fork sim).

## 5. Components & interfaces

- `lib/baskets/types.ts` — `AssetLeg` gains `ticker`; (no new kinds).
- `lib/baskets/registry.ts` — per-bucket sleeves (multiple asset legs) + re-normalized weights; sleeve tokens mirrored in `securities[]`.
- `lib/uniswap/router.ts` *(new)* — pure builder: `(tokenOut, amountUsdce, minOut, recipient) → SwapRouter02 calldata` (+ curated path/fee per token). Unit-testable, no I/O.
- `lib/lifi/basket.ts` — `buildBasketContractCalls` emits prediction **and** asset-leg calls; weight split across all legs, last leg absorbs rounding.
- `lib/lifi/enter.ts` — `buildEnterQuote` same-chain (137) mode + cross-chain stretch flag.
- `lib/dashboard/service.ts` — handle **N** asset legs (sleeve) in `legs[]` + NAV; hero unchanged (still PRIMARY belief vs headline-equity band).
- `contracts/` — **unchanged** (reuse deployed `EnterBasket`). Fork test extended to cover `enterAssetLeg` via SwapRouter02 on a Polygon fork.

## 6. Data flow (demo spine)

Arc passkey USDC (Polygon) → user signs **one** LI.FI Composer tx → LI.FI swaps USDC→USDC.e, fans the deposit:
per market → `enterPredictionLeg` (neutral YES+NO set → wallet); per sleeve token → `enterAssetLeg` → Uniswap
`SwapRouter02` swap → token swept → wallet. Unified NAV (Arc) reflects sets + sleeve tokens.

## 7. Error handling

- `enterAssetLeg` is **revert-safe**: a bad/under-delivering route (`outBal < minAmountOut`) refunds that
  slice's USDC.e to the recipient and emits `AssetLegRefunded` — one leg failing never fails the whole basket.
- `enterPredictionLeg` already guards `qid/cid` mismatch + resolved markets + refunds on split failure.
- Dashboard/mindshare keep the existing graceful live→seed fallback; a down `/quote` falls back per security.

## 8. Testing strategy (TDD, keep the suite green)

1. **Pure router calldata** (`lib/uniswap/router.ts`): encodes correct `SwapRouter02` selector/path/recipient/minOut per token (mocked, deterministic). *RED→GREEN.*
2. **Registry**: weights still sum to 1 with sleeves; **anti-drift** asset-leg↔LIVE-UNISWAP-security consistency; sleeve tokens are in the liquid universe.
3. **`buildBasketContractCalls`**: emits one prediction call per market + one asset call per sleeve token; amounts sum to the deposit (last leg remainder); each asset call targets `enterAssetLeg` with the router calldata.
4. **`buildEnterQuote`**: same-chain (137) request shape; cross-chain flag toggles `fromChainId`.
5. **Foundry fork**: `enterAssetLeg` buys a real sleeve token via SwapRouter02 on a Polygon fork → recipient holds the token, contract retains nothing; failure path refunds.
6. **Live (manual, gated)**: one same-chain LI.FI Composer route executed; Uniswap swap tx; Arc Paymaster/CCTP — recorded in `README.md` with hashes.

## 9. Risks & mitigations

- **LI.FI same-chain Composer** — ✅ verified builds today; mitigated.
- **SwapRouter02 calldata callable by a contract** — Approach A fits the deployed `approve→call→sweep` exactly; verify router address + per-token fee tiers on a Tenderly fork before shipping; revert-safety contains any miss.
- **Arc load-bearing** — elevate Paymaster userOp **or** CCTP transfer from optional to required; pick whichever is live on Arc Testnet (Circle MCP check).
- **Thin theme-precise tokens** — explicitly excluded; sleeve is liquidity-gated risk-proxies, equity anchors carry theme precision.

## 10. Out of scope (YAGNI)

Full `securities[]`↔`legs[]` unification; cross-chain spine (stays a flag); UniswapX exit; theme-perfect illiquid tokens; any `EnterBasket` redeploy.
