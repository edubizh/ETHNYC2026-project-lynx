# CLAUDE.md — Project-Lynx (ETHGlobal NY 2026)

> Copy this file to the **root of the new hackathon repo**. It's the briefing auto-loaded each session.
> Detailed docs live in `docs/` (see `docs/README.md`).

## What we're building

**Project-Lynx** — a **non-custodial, thematic prediction-market index + intelligence dashboard**. Users browse themed buckets (US Politics, Military, AI, …). Each theme shows a dashboard whose hero feature is the **AI Sentiment Gap** — belief-market odds (Polymarket/Kalshi) vs the AI-correlated asset's **percentile within a published analyst bull/bear band** (the band is shown in the UI). Never framed as "implied probability." "Enter a theme" = **one signature** buys a curated basket: a real Polymarket neg-risk outcome-token set (USDC.e collateral) + a real on-chain asset leg, **into the user's own wallet**.

## The 3 sponsors and their load-bearing roles

- **Arc (Circle)** = the **account/NAV layer only** — Circle Modular Wallet (passkey) on Arc Testnet, USDC balance, USDC-gas via Paymaster, unified NAV across Arc + Polygon. → Arc **Target A** (prediction markets w/ real-world signal) + **Target B** (chain-abstracted USDC hub). NOTE: LI.FI Arc→Polygon has **ZERO routes** (verified); the one-signature route originates on **Ethereum/Base, NOT Arc**.
- **LI.FI** = the one-signature **assembly/entry**. Composer bundles swap→bridge→`EnterBasket` (split across legs), pre-simulated; Widget for the UI. → _Most Innovative Composer App_ + _Best UX_.
- **Uniswap** = the **standalone real Trading-API `/swap`** that earns Best API Integration ($7k), **decoupled from the basket**, + the `/quote` **price oracle** powering the dashboard. xStocks/NVDA are **display-only** (not on Polygon, US-gated, illiquid). **UniswapX** exit is an **ETH/Base stretch** only. → _Best Uniswap API Integration ($7k)_.

## Hard constraints (do NOT relitigate)

1. **Tap existing markets — never create our own.** We layer on Polymarket (on-chain) + Kalshi (API). Gemini Predictions appears too thin to rely on. We never invent questions or own resolution. The prediction leg uses the **permissionless `NegRiskAdapter.splitPosition` path (neutral YES+NO set)**, NOT the operator-gated directional CLOB.
2. **Non-custodial — never be the venue/fund.** Positions land in the user's own wallet. We never pool/custody user funds.
3. **Not an aggregator, not a maker-vault, not extraction.** Value flows to the user. The product is the _thematic basket + divergence intelligence_, not a price dashboard or a trading strategy we run.
4. **Submit to exactly 3 sponsors:** Arc + LI.FI + Uniswap.

## Status

Design **locked & approved** (2026-06-13). Architecture = **Approach B+** (Polygon mainnet `137` execution chain + Arc account layer + LI.FI entry from Ethereum/Base). **Approach A** (Arc-origin LI.FI route) is verified **DEAD today** — feature-flagged in case Arc ships a route mid-event. MVP theme = **AI** (alternates: US Politics, Military). Build order + Day-1 de-risk in `docs/04-build-plan-and-derisk.md`; task-by-task plan in `docs/05-implementation-plan.md`.

## Stack (planned)

Next.js + React + wagmi/viem · LI.FI SDK + Widget (entry from Ethereum/Base) · Uniswap Trading API + Universal Router + sdk-core · Circle Wallets/Paymaster + CCTP/Gateway · Solidity + Foundry for the `EnterBasket` executor · on-chain surface incl. `NegRiskAdapter` + `WrappedCollateral` · **Polygon mainnet (`137`) execution chain + Tenderly VNet fork (Polygon) for dev/sim** · Arc Testnet (chain `5042002`, RPC `https://rpc.testnet.arc.network`).