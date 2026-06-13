# CLAUDE.md — Project-Lynx (ETHGlobal NY 2026)

> Copy this file to the **root of the new hackathon repo**. It's the briefing auto-loaded each session.
> Detailed docs live in `docs/` (see `docs/README.md`).

## What we're building

**Project-Lynx** — a **non-custodial, thematic prediction-market index + intelligence dashboard**. Users browse themed buckets (US Politics, Military, AI, …). Each theme shows a dashboard whose hero feature is the **divergence signal** — _what belief-markets imply_ (Polymarket/Kalshi odds) vs _what the real asset is pricing in_ (tokenized stocks). "Enter a theme" = **one signature** buys a curated basket of real prediction-market positions + tokenized-stock positions **into the user's own wallet**.

## The 3 sponsors and their load-bearing roles

- **Arc (Circle)** = the account/money layer + chain-abstracted USDC hub. User's USDC balance, USDC-gas, passkey wallet, USYC yield on idle, EURC/native-FX, unified NAV, settlement. → Arc **Target A** (prediction markets w/ real-world signal) + **Target B** (chain-abstracted USDC hub).
- **LI.FI** = the one-signature **assembly/entry**. Composer bundles swap→bridge→`EnterBasket` (split across legs), pre-simulated; Widget for the UI. → _Most Innovative Composer App_ + _Best UX_.
- **Uniswap** = the **tokenized-securities** legs (xStocks via Universal Router/Trading API), the `/quote` **price oracle** powering the dashboard/divergence, and **UniswapX** exit. → _Best Uniswap API Integration ($7k)_.

## Hard constraints (do NOT relitigate)

1. **Tap existing markets — never create our own.** We layer on Polymarket (on-chain) + Kalshi (API). Gemini Predictions appears too thin to rely on. We never invent questions or own resolution.
2. **Non-custodial — never be the venue/fund.** Positions land in the user's own wallet. We never pool/custody user funds.
3. **Not an aggregator, not a maker-vault, not extraction.** Value flows to the user. The product is the _thematic basket + divergence intelligence_, not a price dashboard or a trading strategy we run.
4. **Submit to exactly 3 sponsors:** Arc + LI.FI + Uniswap.

## Status

Design **locked & approved** (2026-06-13). Architecture = **Approach A** (real Polymarket on Polygon + Arc as USDC hub routing cross-chain + Uniswap securities), with **Approach B** (single-chain Polygon) as the live fallback. MVP theme = **AI** (alternates: US Politics, Military). Build order + Day-1 de-risk in `docs/04-build-plan-and-derisk.md`; task-by-task plan in `docs/05-implementation-plan.md`.

## Stack (planned)

Next.js + React + wagmi/viem · LI.FI SDK + Widget · Uniswap Trading API + Universal Router + sdk-core · Circle Wallets/Paymaster + CCTP/Gateway + USYC · Solidity + Foundry for the `EnterBasket` executor · Arc Testnet (chain `5042002`, RPC `https://rpc.testnet.arc.network`).

.
