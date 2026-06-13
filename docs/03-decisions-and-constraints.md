# 03 — Decisions, Constraints & Rationale

> Read this before changing direction. These are settled. The "why" is included so a new session doesn't relitigate.

## Locked decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Product = non-custodial thematic prediction-market index + divergence dashboard** ("Project-Lynx") | Only shape that is a real *product* (people use it), is pro-user, taps real markets, isn't an aggregator/maker-vault, and makes all 3 sponsors load-bearing. |
| 2 | **Sponsors = Arc + LI.FI + Uniswap** (submit to exactly these 3) | Arc = account/hub (2 tracks). LI.FI = one-sig assembly. Uniswap = tokenized securities + price oracle + intent exit. Each on the critical path. |
| 3 | **Non-custodial: positions land in the user's own wallet** | Avoids being a fund/venue (regulation, KYC, "be the house" role the user explicitly rejected). |
| 4 | **Tap existing markets; never create our own** | Hard user constraint. We layer on Polymarket (on-chain) + Kalshi (API). Never invent questions or own resolution. |
| 5 | **Differentiator = the divergence engine** (belief-implied vs asset-implied) | The one thing only we can show (we hold both prediction markets *and* real assets per theme). It's why Uniswap/tokenized-securities is essential, not decorative. |
| 6 | **Architecture = Approach A** (real Polymarket on Polygon + Arc-as-USDC-hub), **fallback B** (single-chain Polygon) | A nails both Arc tracks (chain-abstraction = Target B). B de-risks if Arc↔Polygon routing isn't ready. |
| 7 | **MVP theme = AI** (alternates: US Politics, Military) | Rich markets + obvious tokenized-stock pairing (NVDA) for a vivid divergence demo. |
| 8 | **Slot-3 = Uniswap, not Chainlink** | We *use* Chainlink xStocks Data Streams for free; Uniswap (tokenized securities + API) is the day-old narrative and gives a real, demoable on-chain execution. (Chainlink remains the strong alternative if the Uniswap real-tx requirement is blocked by KYC gating.) |

## The DO-NOT list

- ❌ **Don't become the venue / hold a pooled fund.** No custody of user funds. (Killed the "float / zero-edge market" idea — it structurally requires custody.)
- ❌ **Don't create markets** or own resolution.
- ❌ **Don't build a plain aggregator / odds dashboard** — done to death (pmxt, PolyRouter, Converge). Our net-new value is the *basket instrument* + the *divergence intelligence*.
- ❌ **Don't build a maker-vault / market-making strategy** — that's a private money tool, "not a product," rejected by the user.
- ❌ **Don't let LI.FI and Uniswap visibly do the same swap** in the demo — narrate the handoff (LI.FI assembles/enters cross-chain; Uniswap is the securities venue + price/exit).
- ❌ **Don't over-claim Kalshi/Gemini.** Kalshi = API read + user-account trade only (custodial). Gemini = likely out of scope.

## Constraint reality (the custody wall)

- **Polymarket is on-chain/composable** (Polygon) — full read + execute + compose.
- **Kalshi + Gemini are custodial CEXs** — API only; can't move their money on-chain or compose atomically with Polymarket. "Tap all three" realistically = unified read across all + on-chain execution on Polymarket + (optional) API execution on Kalshi via the user's account.
- **Yield only ever applies to a user's *idle* balance we hold on Arc** — never to collateral locked inside a venue (we don't custody it).

## Ideas considered and rejected (don't re-explore without reason)

- **Float / zero-edge "no house edge" market** — clever, but needs custody → would make us the venue. ❌
- **Maker-vault / cross-venue liquidity provision** — extraction, not a product. ❌
- **Yield-on-collateral (Drift-style)** — too obvious / already exists; not ingenious. ❌
- **Coincidence-of-wants P2P matching** — ingenious, but escrowing matched stakes edges toward being a venue. Parked.
- **Futarchy / decision markets** — hot, but requires creating markets → breaks constraint #4. ❌

## Open product choices (safe to revisit in the build)

- Final **name**: **Project-Lynx** (locked).
- Exact **basket composition** per theme (which Polymarket markets + which xStocks + weights).
- Whether the **basket registry** is static JSON (MVP) or on-chain (stretch).
- Whether to do the Polymarket CTF buy on **mainnet (tiny real amount)**, **mainnet-fork**, or **mock** for the demo.

## Mandatory deliverables (all sponsors)

Working **frontend + backend**, **architecture diagram**, **demo video** (name + show each sponsor tool used), docs, **public repo**, **incremental git history**. Uniswap also needs the **Developer Feedback Form**; Arc weights **depth of Circle-tool use**.
