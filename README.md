# Project-Lynx

**A non-custodial, thematic prediction-market index + intelligence dashboard.** Browse a theme (AI), see the hero **AI Sentiment Gap** — belief-market odds vs. where the AI-correlated asset sits as a **percentile within a published analyst bear/bull band** — then **enter a curated basket in one signature**: a real Polymarket NegRisk neutral YES+NO set (USDC.e) + an on-chain asset leg, delivered **into your own wallet**.

> ETHGlobal New York 2026 · Architecture = **Approach B+** (Polygon `137` execution + Arc `5042002` account/NAV + a **same-chain Polygon** LI.FI entry spine, with Ethereum/Base cross-chain behind a flag). See [`docs/architecture.md`](docs/architecture.md), [`docs/demo-script.md`](docs/demo-script.md), and the live-qualification runbook [`docs/task-9-live-qualification.md`](docs/task-9-live-qualification.md).

## Sponsors (submitting to 5 tracks across 3 sponsors)

- **Arc (Circle)** — account/NAV layer: Modular Wallet **passkey**, USDC balance, **USDC-gas** userOp (`paymaster: true`, one-click in the Account panel), unified NAV across Arc + Polygon. → Target A + Target B.
- **LI.FI** — one-signature assembly: `getContractCallsQuote` fans one deposit across N `enterPredictionLeg` + M `enterAssetLeg` calls into `EnterBasket`, on a **same-chain Polygon (137)** spine (Ethereum/Base is a flagged stretch). → Composer + Best UX.
- **Uniswap** — `/quote` price oracle for the dashboard **and** the per-leg `minAmountOut` floor for every on-chain sleeve swap (`SwapRouter02`), + a **separate standalone** Trading-API `/swap` (the **$7k** artifact). → Best API Integration.

## What's in here

```
lib/            divergence engine · basket registry (+ multi-asset sleeves) · data adapters (Polymarket/Yahoo/Uniswap)
lib/lifi/       planEntry (chain→entry selector) · basket (contractCalls) · enter (Composer quote) · assetQuotes (minOut floors)
lib/uniswap/    SwapRouter02 calldata builder + adapters; scripts/runPrizeSwap.ts = the standalone $7k swap
lib/arc/        Circle Modular Wallet passkey + USDC-gas userOp (sendArcGaslessUserOp) + ArcProvider context
app/            Next.js App Router — Browse treemap, /theme/[slug] dashboard, /api/theme/[slug] + /api/basket-entry
components/     Browse · BuyBox · EnterSheet (4-step LI.FI) · AccountPanel (Arc + USDC-gas op) · ArcAccountBar · TopBar
contracts/      Foundry — EnterBasket.sol + fork tests (real NegRiskAdapter + real SwapRouter02 swap on a Polygon fork)
docs/           product/design/decisions + architecture, demo script, go-live + task-9 live-qualification runbook
```

## Run it

```bash
npm install
cp .env.example .env.local      # fill UNISWAP_API_KEY (hard-fails without it), EQUITIES_API_KEY, NEXT_PUBLIC_CIRCLE_CLIENT_KEY …
npm test                        # 82 unit tests (vitest)
npm run dev                     # http://localhost:3000  → /theme/ai
# contracts (needs Foundry):
cd contracts && forge test -vv  # fork test against real Polygon NegRiskAdapter
# standalone Uniswap $7k swap (throwaway funded wallet; key from shell env, never committed):
UNISWAP_API_KEY=… POLYGON_RPC=… PRIVATE_KEY=0x… npx tsx scripts/runPrizeSwap.ts
```

## Verification status (honest)

**LIVE on-chain / in-app (this build, all three sponsors):**
- ✅ **Uniswap $7k** — real USDC→wstETH swap via the Trading API on Polygon (status 1, Universal Router), tx below. `/quote` is also the **live** dashboard price oracle **and** the per-leg `minAmountOut` floor for every on-chain sleeve swap.
- ✅ **EnterBasket deployed** to Polygon mainnet (address + tx below), revert-safe, on-chain-verified wiring; exposes `enterPredictionLeg` (NegRisk neutral YES+NO set) **and** `enterAssetLeg` (Uniswap `SwapRouter02`).
- ✅ **Arc** — Circle Modular Wallet **passkey** smart account on Arc Testnet, **unified NAV** (Arc USDC + Polygon basket), and a one-click **USDC-gas userOp** (`paymaster: true`) in the Account panel (Arc Testnet Paymaster verified live: v0.8 `0x3BA9…8966`).
- ✅ **Dashboard pulls all-live data:** Polymarket Gamma odds + NVDA price + free **Yahoo analyst price-target bands** + Uniswap `/quote` → the AI Sentiment Gap (every value tagged `live`, with seeded fallback).

**Architecture / engineering (this build):**
- **Entry spine = same-chain Polygon (137):** one LI.FI Composer signature swaps native USDC→USDC.e and fans the deposit across N `enterPredictionLeg` + M `enterAssetLeg` calls — verified buildable vs `li.quest/v1/quote/contractCalls` (executor `0x2dfaDAB8…378D`). No bridge → no fee-vs-fixed-amount revert. Cross-chain (Ethereum/Base) is a flagged stretch (`NEXT_PUBLIC_ENABLE_CROSSCHAIN_ENTRY`).
- **On-chain asset sleeve:** each bucket buys a sleeve of deeply-liquid Polygon tokens (AI = WETH + LINK; others use WETH/WBTC/LINK) via `enterAssetLeg` → `SwapRouter02`, slippage-floored by Uniswap `/quote`, swept to the user. The server route `/api/basket-entry` resolves the floors and **refuses to ship a 0-minOut swap**. Equity names (NVDA …) stay the analyst-band anchor.

**Verified / tested:**
- ✅ `NegRiskAdapter.col() == USDC.e`; both basket markets unresolved (`getDetermined == false`) — on-chain (blockscout).
- ✅ `getPositionId(questionId, true/false)` **== Gamma clobTokenIds to full 256-bit precision** (cast) — the #1 demo-killer.
- ✅ **Foundry fork test (7/7) on a real Polygon fork**: recipient holds BOTH YES+NO outcome tokens AND `EnterBasket` retains ZERO; a **REAL USDC.e→WETH swap executes inside `enterAssetLeg`** (SwapRouter02); mismatched `(conditionId, questionId)` reverts fast. (`EnterBasket` inherits `ERC1155Holder` so the adapter's `safeBatchTransferFrom` succeeds.)
- ✅ Live LI.FI: same-chain Polygon (137→137) Composer builds (USDC→USDC.e, executor `0x2dfaDAB8…378D`); Ethereum/Base → Polygon non-empty; **Arc → Polygon `{connections:[]}`** (dead, as designed).
- ✅ API shapes pinned against current docs/SDKs (Uniswap Trading API, `@lifi/sdk`, `@circle-fin/modular-wallets-core@1.0.13`).
- ✅ `next build` green (incl. `/api/basket-entry`); `tsc` clean; **82 vitest tests** green.

**Remaining (live ops — see [`docs/task-9-live-qualification.md`](docs/task-9-live-qualification.md)):**
- ⏳ **Submit the Uniswap Developer Feedback Form** with the swap tx hash (required for the $7k prize).
- ⏳ Execute **one live same-chain LI.FI route** from a Polygon wallet holding native USDC; record the hash. (No bridge on the same-chain spine, so the prior cross-chain "amount tuning" caveat does not apply; it remains only for the flagged cross-chain stretch.)
- ⏳ Fund the Arc smart account from `faucet.circle.com`, then click **Send USDC-gas test op** in the Account panel; record the ArcScan hash.

## Recorded tx hashes (real, on-chain)

**`EnterBasket` deployed (Polygon 137):** [`0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0`](https://polygonscan.com/address/0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0) — on-chain-verified wiring (`adapter()` = NegRiskAdapter, `usdce()` = USDC.e).

| Artifact | Chain | Tx hash |
|---|---|---|
| `EnterBasket` deployment | Polygon 137 | [`0xb71430e8a5baa6b616ae8dc06c13597ff33c31ad89561263b42fe94d08cde4b7`](https://polygonscan.com/tx/0xb71430e8a5baa6b616ae8dc06c13597ff33c31ad89561263b42fe94d08cde4b7) |
| **Uniswap standalone `/swap` ($7k)** | Polygon 137 | [`0x23a05c509b64c36ef38671d19a965f8464ca1c2876848637924972a72327cbde`](https://polygonscan.com/tx/0x23a05c509b64c36ef38671d19a965f8464ca1c2876848637924972a72327cbde) ✅ status 1, via Universal Router `0x1095…`, delivered wstETH |
| `EnterBasket` entry (via LI.FI) | Polygon 137 | `<record after executeRoute>` |
| Arc USDC-gas Paymaster tx | Arc 5042002 | `<record from the passkey flow>` |

## Hard constraints (do not relitigate — see `docs/03`)

Tap existing markets (never create our own) · non-custodial (never the venue/fund) · positions to the user's own wallet · the prediction leg uses the permissionless `NegRiskAdapter.splitPosition` neutral-set path, never the operator-gated CLOB · the hero is the **AI Sentiment Gap**, never "implied probability."
