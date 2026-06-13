# 01 — Product & Design

## The one-liner

> **Project-Lynx** is a non-custodial, thematic prediction-market index + intelligence dashboard. Browse themed buckets (US Politics, Military, AI, …); each has a dashboard whose hero is the **divergence signal** — what belief-markets imply vs. what real assets are pricing in. **Enter a theme in one signature** → a curated basket of real prediction-market positions + tokenized stocks lands in your own wallet.

## The core insight (the differentiator)

A binary prediction market gives a crowd-implied **probability** of a real-world event. A tokenized stock gives the **market's money-weighted** view of related outcomes. Project-Lynx is the only place that holds **both on the same theme**, so it can compute and surface their **divergence**:

> "Belief markets imply ~72% AI-acceleration; NVDA is only pricing ~58% — a **14-point gap**." → a tradeable signal nobody else can show.

This turns a price dashboard into a **narrative-intelligence terminal**. It is the soul of the product and the reason Uniswap (tokenized securities) is load-bearing, not decorative.

## Why this shape (vs. everything we rejected)

- It **taps real markets** (Polymarket on-chain, Kalshi via API) without creating any.
- It's **non-custodial** — positions go to the user's wallet; we never become a fund/venue.
- It's **pro-user**, not extraction (no maker-vault, no house edge, no money-making-for-us scheme).
- It is **not a plain aggregator** — the thematic basket *instrument* + the divergence *intelligence* are net-new, not a price-comparison dashboard.

(Full rationale + the rejected directions are in `03-decisions-and-constraints.md`.)

## MVP — the thinnest end-to-end slice (the demo)

**One theme, fully alive.** Lead with **AI** (rich markets + obvious xStock pairing; US Politics / Military are alternates).

90-second demo:
1. **Open the AI dashboard** — basket legs shown: 2–3 Polymarket markets (e.g. "Will OpenAI release GPT-6 in 2026?") + tokenized **NVDA**. Live odds (Polymarket Gamma API) + live NVDA price (Uniswap `/quote` + Chainlink xStocks Data Streams).
2. **The divergence signal fires** — "belief ~72% vs asset ~58% → 14-pt gap." The screen nobody else has.
3. **Enter the basket — one signature** — fund from any token/chain; **LI.FI Composer** swaps→bridges→calls `EnterBasket`, which buys the **real Polymarket CTF legs** into the wallet + a **real Uniswap xStock swap**. Pre-simulated, can't half-fail.
4. **Account on Arc** — passkey login, USDC balance, gas in USDC, unified NAV across legs.
5. **Exit** — sell back (stretch: one-signature gasless UniswapX intent).

Everything held is in the **user's own wallet**. We never custody; we never created a market.

## Architecture — 6 clean units

1. **Frontend** — Next.js + wagmi/viem + **LI.FI Widget**. Theme browser → per-theme dashboard → divergence panel → "Enter" flow → portfolio/NAV.
2. **Dashboard data service** — aggregates Polymarket Gamma/Data API (odds, volume) + Kalshi API (cross-venue odds = a second signal) + Uniswap `/quote` (stock price) + Chainlink xStocks Data Streams. Computes divergence.
3. **Divergence engine** — pure logic: per-leg *belief-implied probability* vs *asset-implied* → gap + direction. Off-chain in MVP.
4. **Basket registry** — curated theme config: legs (Polymarket condition/token IDs + xStock token addresses) + weights. Static JSON in MVP; on-chain registry = stretch.
5. **`EnterBasket` executor** (Solidity/Foundry) — takes USDC → buys Polymarket CTF legs (CTF Exchange, Polygon) + xStock legs (Uniswap Universal Router) → positions to the user's wallet. Exposed so **LI.FI's destination-contract-call** can invoke it in one signature (the fallback if Composer doesn't natively recognize the legs).
6. **Arc account layer** — Circle passkey Wallet, USDC balance + USDC-gas, CCTP/Gateway routing Arc↔Polygon, unified NAV. (USYC yield + EURC FX = stretch.)

## Data flow (Approach A)

```
Browse → data service (Polymarket + Kalshi + Uniswap /quote + Chainlink) → dashboard + divergence
Enter  → LI.FI SDK getRoutes (source: Arc USDC → dest: EnterBasket on Polygon, one signature)
       → Composer: swap → bridge → EnterBasket → {CTF legs + xStock leg} into user wallet
Account→ NAV/PnL surfaced on Arc; idle USDC → USYC (stretch); EUR buy-in via FX (stretch)
Exit   → sell legs (MVP) / UniswapX intent (stretch)
```

## The three architectural approaches

| | What it is | Arc track fit | Risk |
|---|---|---|---|
| **A — Multi-chain, real Polymarket + Arc-as-hub** ⭐ chosen | Real CTF buys on Polygon + ≥1 real Uniswap xStock swap; LI.FI Composer enters in one sig from Arc USDC, routed cross-chain; Arc = account + USDC hub | **Best** — Target A *and* Target B (chain abstraction is the feature) | Highest: Arc↔Polygon routing on testnet |
| **B — Single-chain (Polygon), Arc as account mirror** (live fallback) | Everything on Polygon (Polymarket + xStocks-on-Polygon); Arc holds balance/yield/identity + NAV | Weaker Target B | Lowest |
| **C — Arc-native synthetic positions** | Represent positions on Arc | — | ❌ Rejected — makes us the venue, breaks non-custodial / tap-real-markets |

**Decision:** build toward **A**, collapse to **B** if Arc↔Polygon routing isn't ready on testnet Day 1.

## MVP ↔ Stretch split

**MVP:** one theme (AI) · dashboard with live odds + stock price + ≥1 divergence pairing · one-signature `EnterBasket` (real CTF legs + ≥1 real Uniswap xStock swap) · Arc passkey account + USDC balance/gas + unified NAV · basic exit.

**Stretch (priority order):** USYC dry-powder yield → EURC multi-currency buy-in → UniswapX gasless exit → more themes → agentic "build me a basket for `<theme>`" (LI.FI Agentic $2k) → BigQuery historical divergence analytics → on-chain basket registry → v4 hook for a basket pool.
