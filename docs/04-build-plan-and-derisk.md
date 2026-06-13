# 04 — Build Plan, De-Risk & Demo

## Day-1 de-risk checklist (do these BEFORE committing code paths — hit the booths)

- [ ] **Arc↔Polygon USDC routing on testnet** (CCTP/Gateway). Polygon is NOT on the Gateway *testnet* list → confirm a working path (CCTP, or route via a supported testnet chain). **If blocked → switch to Approach B (single-chain Polygon).** (Circle booth)
- [ ] **≥1 executable xStock (or yield-bearing RWA) swap** despite KYC/jurisdiction gates — required for the Uniswap $7k real-tx prize. Get the exact token address + chain that works for us. (Uniswap booth)
- [ ] **Polymarket CTF buy** path for the demo: testnet vs. mainnet-fork vs. tiny real mainnet amount. Confirm CTF Exchange v2 addresses + Gamma/CLOB API access.
- [ ] **LI.FI Composer recognition** of our legs as deposit targets — if it doesn't auto-fire, confirm the **SDK destination-contract-call → `EnterBasket`** fallback. (LI.FI booth)
- [ ] **Circle Wallets passkey + Paymaster** on Arc testnet — confirm gasless/USDC-gas works.
- [ ] **xStocks price feed** (Chainlink xStocks Data Streams) reachable for the dashboard.
- [ ] Confirm whether the cap is **3 sponsors or 3 prizes** (Arc's 2 tracks are free upside either way; if a 4th submission is allowed, also submit Uniswap-adjacent or Chainlink).

## MVP build order (vertical slices — each demoable on its own)

1. **Scaffold** — Next.js app + wagmi/viem; connect to Arc testnet (`5042002`); Circle passkey wallet + USDC faucet; repo with incremental commits from the start.
2. **Dashboard read-path** — data service pulling Polymarket Gamma odds + Uniswap `/quote` price for the AI theme; render the theme dashboard. *(Demoable: live theme board.)*
3. **Divergence engine** — compute belief-implied vs asset-implied for one pairing; render the signal. *(Demoable: the hero screen.)*
4. **`EnterBasket` contract (Foundry)** — buy Polymarket CTF legs + one xStock leg via Uniswap Universal Router; positions to caller's wallet. Test on fork. *(Demoable: scripted basket buy with real tx IDs.)*
5. **LI.FI one-signature entry** — SDK `getRoutes` (source Arc USDC → dest `EnterBasket` on Polygon) or Composer; Widget UI. *(Demoable: fund-from-anything → enter in one sig.)*
6. **Arc account view** — unified NAV/PnL across legs; USDC balance + USDC-gas. *(Demoable: the account.)*
7. **Polish + record** — architecture diagram, demo video, docs, Uniswap Developer Feedback Form.

**Then stretch (priority):** USYC dry-powder yield → EURC buy-in → UniswapX gasless exit → more themes → agentic basket builder → BigQuery analytics.

## Per-prize deliverable map

| Sponsor / track | What proves it | Notes |
|---|---|---|
| **Arc — Target A** (PM w/ real-world signal) | Themed prediction baskets, settled/accounted on Arc in USDC; real-world events; EURC stretch | Depth of Circle-tool use is weighted |
| **Arc — Target B** (chain-abstracted USDC hub) | Arc USDC balance → routed to Polygon → settled back; one app, no fragmented UX | Gateway/CCTP + Wallets required |
| **LI.FI — Most Innovative Composer App** | One-signature multi-leg `EnterBasket` (split + pre-sim) | "Effective use of Composer" |
| **LI.FI — Best UX** | Widget-powered one-click entry from any token/chain | |
| **Uniswap — Best API Integration ($7k)** | Real on-chain xStock swap (tx IDs) via Trading API + Universal Router | + repo + demo video + **Developer Feedback Form** + API key |

## Demo script (90s)

1. Open the **AI dashboard** — Polymarket odds + NVDA price, live.
2. **Divergence signal** — "belief ~72% vs asset ~58% → 14-pt gap." (the wow)
3. **Enter the basket — one signature** (LI.FI) → real CTF legs + real Uniswap xStock swap land in the wallet (pre-simulated). Show the **tx IDs**.
4. **Arc account** — passkey, USDC balance, USDC-gas, unified NAV. (+ USYC yield / EURC if built)
5. Name each sponsor tool as it's used (required for judging).

## Tech stack (planned)

Next.js + React + wagmi/viem · LI.FI SDK + Widget · Uniswap Trading API + Universal Router + `sdk-core` · Circle Wallets/Paymaster + CCTP/Gateway + USYC · Solidity + **Foundry** (`EnterBasket`) · **Arc Testnet** (`5042002`, RPC `https://rpc.testnet.arc.network`, faucet `https://faucet.circle.com`) · Polygon (Polymarket CTF) · Ethereum (xStocks). Use the **Circle MCP** for SDK snippets.

## Open questions to resolve in the build

- Name: **Project-Lynx** (locked).
- Exact AI-theme basket composition (which Polymarket markets + which xStock + weights).
- Basket registry: static JSON (MVP) vs on-chain (stretch).
- Divergence formula: how to normalize "asset-implied probability" from a stock price (define a transparent, simple proxy for the MVP; refine later).
