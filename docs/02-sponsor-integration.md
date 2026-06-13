# 02 — Sponsor Integration (technical build reference)

> Grounded from the live docs/prize page on 2026-06-13. Verify addresses/track wording at the booths Day 1.

---

## ARC (Circle) — the account/money layer + USDC hub

**Why Arc, what it uniquely gives us:**
- **USDC is the native gas token** — fees paid in dollars; no volatile side-token. Predictable, mainstream UX.
- **Deterministic sub-second finality** (Malachite BFT) — instant, irreversible settlement.
- **Compliance + opt-in privacy** baked in → institutional-grade credibility.

**Our usage (Arc = the account/NAV layer ONLY — execution is on Polygon):**
- The user's **USDC balance and unified NAV/PnL live on Arc**; Arc is the account home, not the execution chain. **LI.FI entry NEVER originates on Arc** — LI.FI Arc→Polygon returns `{connections:[]}` (verified dead 2026-06-13), so entry originates on **Ethereum (1) / Base (8453)** and lands on Polygon (137).
- **USDC-gas (Paymaster) + Circle Modular Wallet (passkey)** → email/passkey onboarding, gasless or USDC-gas. Use `rpcPath '/arcTestnet'` and package **`@circle-fin/modular-wallets-core`** *(CONFIRM the exact version against Circle docs Day-0 — do not assert an unverified version)*.
- **Target B = unified NAV** (treat multiple chains as one liquidity surface, settled through one app); **stretch = a separate Circle CCTP hop**.

**Circle stack:** USDC · **CCTP v2** (Bridge Kit, burn/mint) · **Gateway** (unified balance, <500ms) · **Circle Modular Wallets** (passkey) · **Paymaster** (pay gas in USDC, ~10%) / **Gas Station** (developer-sponsored, ~5%) · **Arc App Kit** (incl. Bridge) · **Circle MCP** (wired into the prep env — use for SDK snippets).

**Testnet (use now):** chain ID **5042002**, RPC `https://rpc.testnet.arc.network`, explorer `https://testnet.arcscan.app`, faucet `https://faucet.circle.com`. EVM-compatible (Foundry/viem/Hardhat).

**Tracks (each ~$3,250; one project may submit to both):**
- **Target A — "Best Prediction Markets Built on Arc with Real-World Signal"** (USDC, EURC, Arc). Examples they cite: CPI/Fed/jobs, elections/geopolitics, institutional hedging, EURC-localized markets.
- **Target B — "Best Chain-Abstracted USDC Apps Using Arc as a Liquidity Hub"** (USDC, Circle Gateway, Circle Wallets). "Treat multiple blockchains as one liquidity surface… sourced, routed, settled through a single app without fragmenting UX." ← our **unified NAV** (account/NAV layer on Arc; execution on Polygon).
- Judging weights **"effective use of Circle's tools" (depth)**. Mandatory: working FE+BE, **architecture diagram, demo video, docs, public repo**.

**⚠️ Flags:** Arc mainnet not live for the event → build on **Testnet** (expected/fine). Arc is the account/NAV layer only — **LI.FI Arc→Polygon = `{connections:[]}` (verified dead)**, so entry originates on Ethereum/Base and Polygon (137) is the execution chain. CCTP/Gateway testnet supported-chains: **Polygon is NOT on the Gateway *testnet* list** (it's mainnet-only) → a Circle CCTP hop is a stretch, not the critical path.

Sources: docs.arc.network · developers.circle.com · ethglobal.com/events/newyork2026/prizes

---

## LI.FI — the one-signature assembly/entry

**Composer** — "on-chain execution engine that bundles multi-step DeFi into a single signed transaction" (EVM-only). Consolidates 3–5 txs into one signed route. Three native patterns; the first **is our basket**:
1. **Route single/multiple assets into positions, *splitting capital across several targets simultaneously*** ← "enter the basket."
2. Wallet ops (consolidate dust, deliver).
3. **Validated execution with per-step preconditions** → we make the basket buy **revert-safe** (below).

**SDK — the verified entry path:** use **`getContractCallsQuote`** (NOT `getRoutes` + `options.destinationCall`). It takes a top-level **`contractCalls`** array; each call envelope needs **`toContractAddress`, `toContractCallData`, `toContractGasLimit`, `fromAmount`, `fromTokenAddress`** → then **`executeRoute`** → status tracking. This is how we call our `EnterBasket` executor on Polygon. Set `fromChain` = **1 / 8453**, `toChain` = **137**, **`toToken` = native USDC** (`0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`); wrap **all** addresses in viem `getAddress()`. Supports Permit2, EIP-7702, EIP-5792.

**No LI.FI pre-sim:** `stepSimulation` returns **`integrator_not_allowed`** — there is no LI.FI-side pre-simulation. Instead **pre-simulate on a Tenderly fork of Polygon**, and make **`EnterBasket` revert-safe** so a failed leg reverts cleanly (Across refunds to `toFallbackAddress`). Do **not** claim the route is atomic / "can't half-fail."

**Widget** — prebuilt, themeable cross-chain UI (wallet mgmt, gasless/relayer routes, fee config, 17 languages). **Works automatically with Composer** → one-click swap+bridge+deposit. Fast path to a polished UI = **Best UX**.

**Aggregation engine** — aggregates many bridges + DEX aggregators + direct DEXs; best pricing, failover, canonical-asset matching. A *complete cross-chain trading stack*, not a single venue.

**Chains:** entry originates on **Ethereum (1) / Base (8453)** → **Polygon (137)** execution. **LI.FI Arc→Polygon = `{connections:[]}` (verified dead 2026-06-13)** — do NOT route entry through Arc; Arc is the account/NAV layer only.

**Tracks ($15k pool):** Most Innovative Composer App **$4k** · Best UX **$4k** · Composer Tooling $3k · Agentic Workflows $2k · Existing-Project $2k (not us). Discriminator everywhere: **"effective use of Composer"** = real multi-step orchestration (our basket split), not a bolted-on bridge.

**⚠️ Flags:** Composer's auto-recognition of *our* legs (Polymarket CTF / xStock tokens) as deposit targets is unconfirmed → the path we ship is **`getContractCallsQuote` → `EnterBasket`** (same one-sig UX). No LI.FI pre-sim (`integrator_not_allowed`) → pre-sim on a **Tenderly fork** and keep `EnterBasket` **revert-safe** (Across refunds `toFallbackAddress`). Assemble on Polygon, account on Arc.

Sources: docs.li.fi/composer/overview · docs.li.fi/sdk/overview · docs.li.fi/widget/overview

---

## UNISWAP — price oracle (`/quote`) + standalone `/swap` for the $7k

**The verified truth (don't relitigate):** when LI.FI routes the basket's asset leg it picks **Fly / SushiSwap** for `USDC→wstETH` and `USDC→USDC.e` on Polygon, and **404s when constrained to Uniswap-only**. So the **basket asset leg does NOT earn the $7k prize.** The prize is won by a **SEPARATE, standalone Trading-API `/swap`** with its **own captured tx hash** — not by the basket flow.

**Trading API** — three endpoints: `/check_approval` (Permit2/router approval), `/quote` (routing+price across **v2/v3/v4/UniswapX**), `/swap` (encoded calldata; app signs/broadcasts). Supports **21–25+ chains incl. Ethereum (1) + Polygon (137)**. Curated unsupported-tokens list at `unsupportedtokens.uniswap.org`.
- **`/quote` = our real price oracle** for the dashboard NAV + the **divergence math** (this stays load-bearing).
- **`/swap` = the $7k artifact:** a **tiny standalone swap** (`USDC↔WETH` or `USDC→wstETH`) we execute on its own, capture the **tx hash**, and submit with the **Developer Feedback Form**. Prefer the Trading-API `/swap` **calldata** over hand-encoding.

**Universal Router** `0x1095692A6237d83C6a72F3F5eFEdb9A670C49223` — this is the **V4 router**. Prefer Trading-API `/swap` calldata rather than hand-encoding the router directly.

**UniswapX** — intent-based: sign an off-chain order (Permit2), fillers compete in a **Dutch auction**; gasless (filler pays), MEV-protected. → one-signature exit/rebalance **only as an Ethereum/Base stretch (NOT Polygon)**. `/quote` returns `permitData` to sign; `/swap` takes the signature; order encoded in `quote.encodedOrder`.

**Permit2** `0x000000000022D473030F116dDEE9F6B43aC78BA3` — one approval shared across basket buys/sells.

**SDKs:** `sdk-core` (Token/CurrencyAmount/Price/Percent = **our basket math**) · `v4 SDK` (quoting; stretch) · Universal Router SDK (encode the multi-leg tx) · **Uniswap AI** swap-integration agent skill (stretch: NL "build me a basket").

**Tokenized securities (display-only):** **NVDA / xStocks by Backed** are shown on the dashboard for the divergence view; their price comes from a **plain equities API, display-only** — not an executable basket leg.

**Track — "Best Uniswap API Integration" ($7k: 4k/2k/1k), OPEN to new projects.** Requirements: **real on-chain execution with transaction IDs**, public GitHub repo, demo video, **Uniswap Developer Feedback Form**, API key from the Trading API Developer Platform.
*(Note: "Best Uniswap Stack Contribution" $3k, the v4-hooks track, is **continuity-only** — not us.)*

**⚠️ Flags:** **`UNISWAP_API_KEY` is a hard Day-0 prize gate** — without it there is no `/swap`, no tx hash, no $7k; secure it first. The prize artifact is the standalone Trading-API `/swap` (tiny `USDC↔WETH` / `USDC→wstETH`), **not** the basket asset leg (LI.FI routes that via Fly/SushiSwap and 404s on Uniswap-only).

Sources: developers.uniswap.org/api/trading/overview · /docs/trading/swapping-api/supported-chains · /docs/liquidity/uniswapx/overview · xstocks.fi

---

## Supporting venues (used, not submitted)

- **Polymarket** (Polygon, on-chain) — **CTF** outcome tokens (ERC-1155); **NegRisk adapter** (multi-outcome). Our AI markets are **`negRisk=true` AND `restricted=true`**. Collateral is **USDC.e** (`0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`) — **NOT pUSD / native USDC** (verified via `NegRiskAdapter.col()`). Key addresses: **NegRiskAdapter** `0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296` · **WrappedCollateral (wcol)** `0x3A3BD7bb9528E159577F7C2e685CC81A765002E2` · **ConditionalTokens (CTF)** `0x4D97DCd97eC945f40cF65F87097ACe5EA0476045`. We build a **neutral YES+NO set via `splitPosition`** (tokens mint vs WrappedCollateral; `positionIds` from `NegRiskAdapter.getPositionId(questionId, bool)`). **`splitPosition` is permissionless** — the contract call itself is not geo-blocked — **but no team member touches the Polymarket UI / CLOB on US soil.** Directional buys require the **operator-gated CLOB** (not composable on-chain). Plus **Gamma** (market data) + **Data** APIs as the odds source.
- **Kalshi** (off-chain CEX) — REST/WebSocket/FIX API. **Optional cross-venue panel only** — read odds for the cross-venue divergence signal. Not composable on-chain.
- **Gemini Predictions** — no usable developer API found; treat as **optional / out of scope** unless it surfaces at the event.
