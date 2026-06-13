# 04 — Build Plan, De-Risk & Demo

## Day-1 de-risk checklist (do these BEFORE committing code paths — hit the booths)

- [ ] **(P0, Day-0) Register the Uniswap Trading API key + capture ONE live `/quote` AND `/swap` on Polygon** — pin the exact response shapes; make config **hard-fail if the key is missing**. (Uniswap booth)
- [ ] **(P0) On a Tenderly Polygon fork: deal USDC.e to `EnterBasket`, approve the NegRiskAdapter, call `splitPosition`, and READ the EXACT minted ERC-1155 ids** via `get_vnet_simulation_asset_changes` + `NegRiskAdapter.getPositionId(questionId, bool)` — **BEFORE writing any transfer code.**
- [ ] **(P0) Stand up the Arc Modular Wallet passkey + land ONE real USDC-gas Paymaster tx on Arc Testnet** — and screenshot it.
- [ ] **(P0) Extract the `questionId` for each basket leg** (QuestionPrepared events / Gamma `questionID` field).
- [ ] **Confirm the LI.FI Ethereum/Base→Polygon `getContractCallsQuote` returns a 200 with a real route** — Arc→Polygon is verified **dead** (`{connections:[]}`). (LI.FI booth)
- [ ] **Confirm the standalone Uniswap `/swap` asset (WETH or wstETH) executes a tiny real tx on Polygon.**
- [ ] **Polymarket CTF buy** path for the demo: testnet vs. mainnet-fork vs. tiny real mainnet amount. Confirm CTF Exchange v2 addresses + Gamma/CLOB API access.
- [ ] **LI.FI Composer recognition** of our legs as deposit targets — if it doesn't auto-fire, confirm the **SDK destination-contract-call → `EnterBasket`** fallback. (LI.FI booth)
- [ ] Confirm whether the cap is **3 sponsors or 3 prizes** (Arc's 2 tracks are free upside either way).

## MVP build order (vertical slices — each demoable on its own)

**First ~8 hours = the four P0 de-risks (do these before anything else):**

1. **Uniswap key + `/quote` + `/swap`** — register the Trading API key (config hard-fails without it); capture a live `/quote` (dashboard oracle) and a live `/swap` on Polygon; pin both response shapes.
2. **Fork split + capture ids** — on a Tenderly Polygon fork: deal USDC.e → `EnterBasket`, approve NegRiskAdapter, call `splitPosition`, and READ the exact minted ERC-1155 ids (`get_vnet_simulation_asset_changes` + `NegRiskAdapter.getPositionId(questionId, bool)`). Extract each leg's `questionId` here too.
3. **Standalone Uniswap tx** — execute a tiny real WETH-or-wstETH `/swap` on Polygon for the $7k prize (decoupled from the basket).
4. **Arc passkey + Paymaster** — Arc Modular Wallet passkey + one real USDC-gas Paymaster tx on Arc Testnet; screenshot it.

**Then the product slices:**

5. **Scaffold** — Next.js app + wagmi/viem; Arc account/NAV layer (`5042002`); repo with incremental commits from the start.
6. **Dashboard read-path** — data service pulling Polymarket Gamma odds + Uniswap `/quote` price for the AI theme; render the theme dashboard. *(Demoable: live theme board.)*
7. **Divergence engine** — compute belief-implied vs asset-implied for one pairing; render the **AI Sentiment Gap**. *(Demoable: the hero screen.)*
8. **`EnterBasket` contract (Foundry)** — built **after** the dashboard; buy Polymarket NegRisk legs (`splitPosition` → neutral YES+NO) via the captured ids; basket asset leg routes via Sushi; positions to caller's wallet. Revert-safe; test on the Tenderly fork. *(Demoable: scripted basket buy with real tx IDs.)*
9. **LI.FI one-signature entry** — SDK `getContractCallsQuote` → `executeRoute` (source **Ethereum/Base** USDC → dest `EnterBasket` on Polygon); Widget UI. *(Demoable: fund-from-anything → enter in one sig.)*
10. **Arc account view** — unified NAV/PnL across Arc + Polygon legs; USDC balance + USDC-gas. *(Demoable: the account.)*
11. **(~hour 28) Deliverables — NOT last** — architecture diagram, demo video, docs, Uniswap Developer Feedback Form.

**Then stretch (priority):** CCTP hop (Arc→Polygon settlement) → UniswapX gasless exit → more themes → agentic basket builder → BigQuery analytics.

## Per-prize deliverable map

| Sponsor / track | What proves it | Notes |
|---|---|---|
| **Arc — Target A** (PM w/ real-world signal) | Themed prediction baskets, settled/accounted on Arc in USDC; real-world events | Depth of Circle-tool use is weighted |
| **Arc — Target B** (chain-abstracted USDC hub) | **Unified NAV across Arc + Polygon** (+ stretch CCTP hop); one app, no fragmented UX | Wallets required; CCTP is stretch, not load-bearing |
| **LI.FI — Most Innovative Composer App** | One-signature multi-leg `EnterBasket` (split + pre-sim) | "Effective use of Composer" |
| **LI.FI — Best UX** | Widget-powered one-click entry from any token/chain | |
| **Uniswap — Best API Integration ($7k)** | A **standalone** Trading-API `/swap` tx (tiny USDC↔WETH or USDC→wstETH on Polygon) — **decoupled from the basket** (basket asset leg routes via Sushi and does NOT earn the prize) | + repo + demo video + **Developer Feedback Form** + API key |

## Demo script (90s)

> **Live fallback:** keep a **pre-funded "already-bridged" Polygon wallet** ready so no beat depends on a live cross-chain settlement completing inside the 90s.

1. Open the **AI dashboard** — Polymarket odds + NVDA price (display-only equities API), live.
2. **AI Sentiment Gap** — "belief ~72% vs asset ~58% → 14-pt gap." (the wow)
3. **Enter the basket — one signature** (LI.FI) → real NegRisk legs + the basket asset leg land in the wallet. Show the **tx IDs**. *(Fall back to the pre-funded Polygon wallet if the bridge hasn't settled.)*
4. **Sell to go directional** — the basket buys the **neutral YES+NO set**; the "sell to go directional" CTA lets the user pick a side. Own this framing before a judge raises it.
5. **Arc account** — passkey, USDC balance, USDC-gas, unified NAV across Arc + Polygon.
6. Name each sponsor tool as it's used (required for judging).

## Tech stack (planned)

Next.js + React + wagmi/viem · LI.FI SDK + Widget (**entry from Ethereum (`1`) / Base (`8453`)**, never Arc) · Uniswap Trading API + Universal Router + `sdk-core` · Circle Wallets/Paymaster + CCTP · Solidity + **Foundry** (`EnterBasket`) · **Polygon mainnet** (`137`, execution chain) + Polymarket **NegRiskAdapter** + **WrappedCollateral** (USDC.e) · **Tenderly VNet fork (Polygon)** for dev/sim (use a Tenderly admin RPC as `POLYGON_RPC`) · **Arc Testnet** (`5042002`, RPC `https://rpc.testnet.arc.network`, faucet `https://faucet.circle.com`) = account/NAV layer only. Use the **Circle MCP** for SDK snippets.

## Open questions to resolve in the build

- Name: **Project-Lynx** (locked).
- Exact AI-theme basket composition (which Polymarket NegRisk markets + which basket asset leg + weights).
- Basket registry: static JSON (MVP) vs on-chain (stretch).
- AI Sentiment Gap formula: how to compute `assetBandPercentile` — the asset's position within a published analyst bear/bull band (a transparent, simple proxy for the MVP; refine later). Never frame it as "implied probability."
