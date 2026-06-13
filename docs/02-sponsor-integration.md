# 02 — Sponsor Integration (technical build reference)

> Grounded from the live docs/prize page on 2026-06-13. Verify addresses/track wording at the booths Day 1.

---

## ARC (Circle) — the account/money layer + USDC hub

**Why Arc, what it uniquely gives us:**
- **USDC is the native gas token** — fees paid in dollars; no volatile side-token. Predictable, mainstream UX.
- **Deterministic sub-second finality** (Malachite BFT) — instant, irreversible settlement.
- **Native FX engine (StableFX)** — USDC↔EURC (+ local stablecoin pairs coming), RFQ + on-chain escrow, payment-versus-payment. *Permissioned* (API key from Circle) — plain EURC handling is the open fallback.
- **USYC** — Circle's tokenized US-Treasury token (~4.5–5%), **instant on-chain USDC redemption** → "dry-powder yield" on idle balance, instantly spendable at entry.
- **Compliance + opt-in privacy** baked in → institutional-grade credibility.

**Our usage (Arc = the brokerage/account layer):**
- One **USDC balance on Arc** is the user's home; Gateway/CCTP route USDC out to Polygon (where Polymarket executes) and settle proceeds back → unified NAV/PnL on Arc. *(This routing IS Target B.)*
- **USDC-gas + Circle Wallets (passkey) + Paymaster/Gas Station** → email/passkey onboarding, gasless or USDC-gas.
- **USYC** on idle balance (stretch). **EURC/native-FX** multi-currency buy-in (stretch).

**Circle stack:** USDC · EURC · **USYC** · **CCTP v2** (Bridge Kit, burn/mint) · **Gateway** (unified balance, <500ms) · **Circle Wallets / Modular Wallets** (passkey) · **Paymaster** (pay gas in USDC, ~10%) / **Gas Station** (developer-sponsored, ~5%) · **StableFX** · **Arc App Kit** (incl. Bridge) · **Circle MCP** (wired into the prep env — use for SDK snippets).

**Testnet (use now):** chain ID **5042002**, RPC `https://rpc.testnet.arc.network`, explorer `https://testnet.arcscan.app`, faucet `https://faucet.circle.com`. EVM-compatible (Foundry/viem/Hardhat).

**Tracks (each ~$3,250; one project may submit to both):**
- **Target A — "Best Prediction Markets Built on Arc with Real-World Signal"** (USDC, EURC, Arc). Examples they cite: CPI/Fed/jobs, elections/geopolitics, institutional hedging, EURC-localized markets.
- **Target B — "Best Chain-Abstracted USDC Apps Using Arc as a Liquidity Hub"** (USDC, Circle Gateway, Circle Wallets). "Treat multiple blockchains as one liquidity surface… sourced, routed, settled through a single app without fragmenting UX." ← our cross-chain routing.
- Judging weights **"effective use of Circle's tools" (depth)**. Mandatory: working FE+BE, **architecture diagram, demo video, docs, public repo**.

**⚠️ Flags:** Arc mainnet not live for the event → build on **Testnet** (expected/fine). CCTP/Gateway testnet supported-chains: **Polygon is NOT on the Gateway *testnet* list** (it's mainnet-only) → de-risk Arc↔Polygon routing Day 1 (use CCTP, route via a supported testnet chain, or fall back to Approach B). StableFX testnet endpoint unverified → plain-USDC/EURC fallback.

Sources: docs.arc.network · developers.circle.com · ethglobal.com/events/newyork2026/prizes

---

## LI.FI — the one-signature assembly/entry

**Composer** — "on-chain execution engine that bundles multi-step DeFi into a single signed transaction" (EVM-only). Consolidates 3–5 txs atomically. Three native patterns; the first **is our basket**:
1. **Route single/multiple assets into positions, *splitting capital across several targets simultaneously*** ← "enter the basket."
2. Wallet ops (consolidate dust, deliver).
3. **Validated execution with per-step preconditions + pre-execution simulation** → the basket buy **can't half-fail**.

**SDK** — `getQuote`/`getRoutes` → `executeRoute` → status tracking; multi-step routes; **arbitrary destination contract calls** (can call our `EnterBasket` on the target chain — our fallback if Composer doesn't natively recognize our legs). Supports Permit2, EIP-7702, EIP-5792.

**Widget** — prebuilt, themeable cross-chain UI (wallet mgmt, gasless/relayer routes, fee config, 17 languages). **Works automatically with Composer** → one-click swap+bridge+deposit. Fast path to a polished UI = **Best UX**.

**Aggregation engine** — aggregates many bridges + DEX aggregators + direct DEXs; best pricing, failover, canonical-asset matching. A *complete cross-chain trading stack*, not a single venue.

**Chains:** router supports **Arc (mainnet 5042 / testnet 5042002, native coin USDC)** + **Polygon (137)** + Base/Ethereum/Arbitrum/Optimism (verified earlier via `/v1/chains`).

**Tracks ($15k pool):** Most Innovative Composer App **$4k** · Best UX **$4k** · Composer Tooling $3k · Agentic Workflows $2k · Existing-Project $2k (not us). Discriminator everywhere: **"effective use of Composer"** = real multi-step orchestration (our basket split), not a bolted-on bridge.

**⚠️ Flags:** Composer's auto-recognition of *our* legs (Polymarket CTF / xStock tokens) as deposit targets is unconfirmed → fallback = **SDK destination contract call to `EnterBasket`** (same one-sig UX). Composer deposit recognition *on Arc specifically* unverified → assemble on Polygon, account on Arc.

Sources: docs.li.fi/composer/overview · docs.li.fi/sdk/overview · docs.li.fi/widget/overview

---

## UNISWAP — tokenized securities + price oracle + intent exit

**Trading API** — three endpoints: `/check_approval` (Permit2/router approval), `/quote` (routing+price across **v2/v3/v4/UniswapX**), `/swap` (encoded calldata; app signs/broadcasts). Supports **21–25+ chains incl. Ethereum (1) + Polygon (137)**. Curated unsupported-tokens list at `unsupportedtokens.uniswap.org`.
- **`/quote` = our price oracle** for the dashboard NAV + the **divergence math**.
- **`/swap` = our execution** for xStock legs.

**Universal Router** — executes **many swaps in one transaction** → the one-tx basket buy + the real on-chain tx the $7k prize needs. Per-chain router addresses (whitelist as needed).

**UniswapX** — intent-based: sign an off-chain order (Permit2), fillers compete in a **Dutch auction**; gasless (filler pays), MEV-protected. → **one-signature basket exit/rebalance** (stretch). `/quote` returns `permitData` to sign; `/swap` takes the signature; order encoded in `quote.encodedOrder`.

**Permit2** — one approval shared across all basket buys/sells. (Arc's StableFX also uses Permit2 → consistent stack.)

**SDKs:** `sdk-core` (Token/CurrencyAmount/Price/Percent = **our basket math**) · `v4 SDK` (quoting; stretch: basket-as-v4-position / rebalancing hook) · Universal Router SDK (encode the multi-leg tx) · **Uniswap AI** swap-integration agent skill (stretch: NL "build me a basket").

**Tokenized securities:** **xStocks by Backed** (1:1 SPV-backed; TSLAX etc.), on **Ethereum + Solana**, expanding to **Polygon/BNB**; unified liquidity via **xChange**. **Priced by "Chainlink xStocks Data Streams"** (sub-second, signed, 24/7) — a free data source for our dashboard (no 4th sponsor slot needed).

**Track — "Best Uniswap API Integration" ($7k: 4k/2k/1k), OPEN to new projects.** Requirements: **real on-chain execution with transaction IDs**, public GitHub repo, demo video, **Uniswap Developer Feedback Form**, API key from the Trading API Developer Platform.
*(Note: "Best Uniswap Stack Contribution" $3k, the v4-hooks track, is **continuity-only** — not us.)*

**⚠️ Flags:** tokenized securities carry **issuer KYC / whitelisting / jurisdictional gates** → the prize needs ≥1 *real* executable tokenized swap. Verify which xStock is executable (testnet / mainnet-fork / tiny real mainnet tx); fallback = a non-gated **yield-bearing RWA** for the real-tx requirement, show gated equities as priced-but-restricted.

Sources: developers.uniswap.org/api/trading/overview · /docs/trading/swapping-api/supported-chains · /docs/liquidity/uniswapx/overview · xstocks.fi

---

## Supporting venues (used, not submitted)

- **Polymarket** (Polygon, on-chain) — **CTF** outcome tokens (ERC-1155); **CTF Exchange v2** (EIP-1271 smart-contract orders); **NegRisk adapter** (multi-outcome); **Gamma** (market data) + **CLOB** (trading) + **Data** APIs. Our on-chain prediction legs + odds source.
- **Kalshi** (off-chain CEX) — REST/WebSocket/FIX API. Read odds (cross-venue divergence signal) + trade via the user's own connected account. Not composable on-chain.
- **Gemini Predictions** — no usable developer API found; treat as **optional / out of scope** unless it surfaces at the event.
- **Chainlink** — *not a submitted sponsor*, but we use **xStocks Data Streams** (free) for real-asset prices in the dashboard/divergence.
