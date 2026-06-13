# 03 — Decisions, Constraints & Rationale

> Read this before changing direction. These are settled. The "why" is included so a new session doesn't relitigate.

## Locked decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Product = non-custodial thematic prediction-market index + divergence dashboard** ("Project-Lynx") | Only shape that is a real *product* (people use it), is pro-user, taps real markets, isn't an aggregator/maker-vault, and makes all 3 sponsors load-bearing. |
| 2 | **Sponsors = Arc + LI.FI + Uniswap** (submit to exactly these 3) | Arc = account/hub (2 tracks). LI.FI = one-sig assembly. Uniswap = tokenized securities + price oracle + intent exit. Each on the critical path. |
| 3 | **Non-custodial: positions land in the user's own wallet** | Avoids being a fund/venue (regulation, KYC, "be the house" role the user explicitly rejected). |
| 4 | **Tap existing markets; never create our own** | Hard user constraint. We layer on Polymarket (on-chain) + Kalshi (API). Never invent questions or own resolution. |
| 5 | **Differentiator = the "AI Sentiment Gap"** (asset percentile in a published analyst band vs belief odds) | The one thing only we can show (we hold both prediction markets *and* real assets per theme). It's why Uniswap/tokenized-securities is essential, not decorative. *(Framed as the analyst-band percentile vs belief odds — never "implied probability" / "asset-implied probability".)* |
| 6 | **Architecture = Approach B+** (Polygon mainnet execution + Arc as account/NAV layer + LI.FI entry from Ethereum/Base) | Polygon = real tx (tiny $1–5). Arc = account/NAV (chain-abstraction = Target B). LI.FI enters from ETH/Base. The **Approach A** Arc-origin route is verified **DEAD** (LI.FI Arc→Polygon = `{connections:[]}`, 2026-06-13) — kept feature-flag only. |
| 7 | **MVP theme = AI** (alternates: US Politics, Military) | Rich markets + obvious tokenized-stock pairing (NVDA) for a vivid divergence demo. |
| 8 | **Slot-3 = Uniswap, not Chainlink** | Uniswap (tokenized securities + API) is the day-old narrative and gives a real, demoable on-chain execution. Chainlink is **not** a data dependency — at most an optional namecheck. (Chainlink remains the strong alternative if the Uniswap real-tx requirement is blocked by KYC gating.) |

## The DO-NOT list

- ❌ **Don't become the venue / hold a pooled fund.** No custody of user funds. (Killed the "float / zero-edge market" idea — it structurally requires custody.)
- ❌ **Don't create markets** or own resolution.
- ❌ **Don't build a plain aggregator / odds dashboard** — done to death (pmxt, PolyRouter, Converge). Our net-new value is the *basket instrument* + the *divergence intelligence*.
- ❌ **Don't build a maker-vault / market-making strategy** — that's a private money tool, "not a product," rejected by the user.
- ❌ **Don't let LI.FI and Uniswap visibly do the same swap** in the demo — narrate the handoff (LI.FI assembles/enters cross-chain and routes the basket's asset leg via Sushi; the Uniswap prize is an explicitly **separate standalone** Trading-API `/swap`, plus `/quote` as the dashboard oracle + UniswapX exit).
- ❌ **Don't over-claim Kalshi/Gemini.** Kalshi = API read + user-account trade only (custodial). Gemini = likely out of scope.
- ❌ **Don't compute positionIds from USDC.e / conditionId** — NegRisk mints against WrappedCollateral (`wcol`), not USDC.e directly. Read ids from `NegRiskAdapter.getPositionId(questionId, bool)`, **not** `ctf.getPositionId(USDC.e, conditionId)`.
- ❌ **Don't call the basket's asset leg the Uniswap prize swap** — the Uniswap $7k track is a **separate standalone** Trading-API `/swap`; the basket asset leg is LI.FI-routed (via Sushi).
- ❌ **Don't claim the cross-chain destination call is atomic / "can't half-fail"** — there is no LI.FI pre-sim for it (`integrator_not_allowed`). It's de-risked via a Tenderly fork + a revert-safe `EnterBasket`, not by atomicity.

## Constraint reality (the custody wall)

- **Polymarket is on-chain/composable** (Polygon) — full read + execute + compose.
- **Kalshi + Gemini are custodial CEXs** — API only; can't move their money on-chain or compose atomically with Polymarket. "Tap all three" realistically = unified read across all + on-chain execution on Polymarket + (optional) API execution on Kalshi via the user's account.
- **Arc's Target-B value is the unified-NAV / chain-abstraction story** — a single USDC account view and one NAV across the user's prediction + asset legs, with Arc abstracting the cross-chain plumbing. (No USYC "dry-powder yield" — that dependency is dropped.)

## Ideas considered and rejected (don't re-explore without reason)

- **Float / zero-edge "no house edge" market** — clever, but needs custody → would make us the venue. ❌
- **Maker-vault / cross-venue liquidity provision** — extraction, not a product. ❌
- **Yield-on-collateral (Drift-style)** — too obvious / already exists; not ingenious. ❌
- **Coincidence-of-wants P2P matching** — ingenious, but escrowing matched stakes edges toward being a venue. Parked.
- **Futarchy / decision markets** — hot, but requires creating markets → breaks constraint #4. ❌

## Open product choices (safe to revisit in the build)

- Final **name**: **Project-Lynx** (locked).
- Exact **basket composition** per theme (which Polymarket NegRisk markets + which on-chain asset leg, e.g. wstETH + which display xStock + weights).
- Whether the **basket registry** is static JSON (MVP) or on-chain (stretch).
- ~~Whether to do the Polymarket CTF buy on mainnet (tiny real amount), mainnet-fork, or mock for the demo.~~ **Resolved:** **Polygon mainnet tiny ($1–5)** for the real tx + a **Tenderly Polygon fork** for dev / pre-sim.

### Resolved decisions (2026-06-13)

- **D1 — Prediction leg:** `splitPosition` mints the **neutral YES+NO set** against **USDC.e** collateral (NegRisk; tokens mint vs WrappedCollateral `wcol`). Directional CLOB is operator-gated.
- **D2 — Swap legs:** the **basket asset leg is LI.FI-routed via Sushi**; the **Uniswap $7k is a separate standalone Trading-API `/swap`** (`/quote` = dashboard oracle). **NVDA is display-only** (equities API).
- **D3 — Execution + dev:** **Polygon mainnet tiny ($1–5)** for the real tx + **Tenderly Polygon fork** for dev/pre-sim; **Arc Testnet (`5042002`) is the account/NAV layer only**.
- **D4 — Scope:** agentic flow = **Day-2 stretch**; **submit to 5 tracks across 3 sponsors** (Arc A+B, LI.FI Composer+UX, Uniswap API).

## Mandatory deliverables (all sponsors)

Working **frontend + backend**, **architecture diagram**, **demo video** (name + show each sponsor tool used), docs, **public repo**, **incremental git history**. Uniswap also needs the **Developer Feedback Form**; Arc weights **depth of Circle-tool use**.

- **Capture real Polygon tx hashes** — both the standalone Uniswap `/swap` and the `EnterBasket` tx — for the submission.
- **Submit the Uniswap Developer Feedback Form.**
- **Schedule these deliverables at ~hour 28** (architecture diagram, demo video, feedback form, tx hashes) — **not** as a last-hour scramble.
