# 01 — Product & Design

## The one-liner

> **Project-Lynx** is a non-custodial, thematic prediction-market index + intelligence dashboard. Browse themed buckets (US Politics, Military, AI, …); each has a dashboard whose hero is the **AI Sentiment Gap** — belief-market odds vs. where the real asset sits as a **percentile within a published analyst bear/bull band**. **Enter a theme in one signature** → a curated basket of real prediction-market positions + tokenized stocks lands in your own wallet.

## The core insight (the differentiator)

A binary prediction market gives a crowd belief **odds** on a real-world event. A tokenized stock has a price that we can locate as a **percentile inside a published analyst bear/bull band** (the band is sourced from analyst price targets and shown in the UI). Project-Lynx is the only place that holds **both on the same theme**, so it can compute and surface the **AI Sentiment Gap** between them:

> "Belief markets put AI-acceleration at ~72%; NVDA sits at the ~58th percentile of its published analyst bear/bull band — a **14-point gap**." → a tradeable signal nobody else can show.

This turns a price dashboard into a **narrative-intelligence terminal**. It is the soul of the product and the reason Uniswap (tokenized securities) is load-bearing, not decorative.

## Why this shape (vs. everything we rejected)

- It **taps real markets** (Polymarket on-chain, Kalshi via API) without creating any.
- It's **non-custodial** — positions go to the user's wallet; we never become a fund/venue.
- It's **pro-user**, not extraction (no maker-vault, no house edge, no money-making-for-us scheme).
- It is **not a plain aggregator** — the thematic basket *instrument* + the divergence *intelligence* are net-new, not a price-comparison dashboard.

(Full rationale + the rejected directions are in `03-decisions-and-constraints.md`.)

## MVP — the thinnest end-to-end slice (the demo)

**One theme, fully alive.** Lead with **AI** (rich markets + an obvious AI-correlated asset pairing — NVDA shown for the gap, wstETH the on-chain leg; US Politics / Military are alternates).

90-second demo:
1. **Open the AI dashboard** — basket legs shown: 2–3 Polymarket markets (e.g. "Will OpenAI release GPT-6 in 2026?") + tokenized **NVDA**. Live odds (Polymarket Gamma API) + live NVDA price from a plain equities API (display-only), with Uniswap `/quote` as the asset-price oracle.
2. **The AI Sentiment Gap fires** — "belief ~72% vs asset at the ~58th percentile of its analyst band → 14-pt gap," band drawn on screen. The screen nobody else has.
3. **Enter the basket — one signature** — fund from any token/chain; **LI.FI Composer** swaps→bridges→calls `EnterBasket`, which lands a **real Polymarket neg-risk split (USDC.e)** + a **real asset leg** in the wallet. The Uniswap **$7k tx is a SEPARATE standalone `/swap`** (own hash). The **source signature is atomic**; the **destination call is pre-validated on a Tenderly fork** (NOT atomic — LI.FI cannot pre-sim, `integrator_not_allowed`).
4. **Account on Arc** — passkey login, USDC balance, gas in USDC, unified NAV across legs.
5. **Exit** — sell back (stretch: one-signature gasless UniswapX intent).

Everything held is in the **user's own wallet**. We never custody; we never created a market.

## Architecture — 6 clean units

1. **Frontend** — Next.js + wagmi/viem + **LI.FI Widget**. Theme browser → per-theme dashboard → divergence panel → "Enter" flow → portfolio/NAV.
2. **Dashboard data service** — aggregates Polymarket Gamma/Data API (odds, volume) + Uniswap `/quote` (asset-price oracle) + a plain equities API (NVDA display price) + a published analyst bear/bull band. Kalshi API is an **optional cross-venue panel only** (AI markets there are too thin to anchor the hero). Computes the AI Sentiment Gap.
3. **Divergence engine** — pure logic: per-leg *belief odds* vs *asset percentile within its analyst band* → gap + direction. Off-chain in MVP.
4. **Basket registry** — curated theme config: legs (Polymarket condition/question IDs + the on-chain asset-leg token, e.g. wstETH) + weights; the display xStock (NVDA) is priced via the equities API, not held. Static JSON in MVP; on-chain registry = stretch.
5. **`EnterBasket` executor** (Solidity/Foundry, Polygon) — takes USDC → **prediction leg:** `NegRiskAdapter.splitPosition(conditionId, amount)` with **USDC.e** as collateral (the adapter wraps it to `wcol` internally), minting the **neutral YES+NO ERC-1155 outcome set** (full thematic exposure; sell either leg later to go directional), then transfers **both** outcome tokens — ids from `NegRiskAdapter.getPositionId(questionId, bool)`, never `ctf.getPositionId(USDC.e, conditionId)` — to an explicit `recipient` calldata param (NOT `msg.sender`); **asset leg:** a Universal Router / Sushi swap into the basket asset. Exposed so **LI.FI's destination-contract-call** can invoke it (the fallback if Composer doesn't natively recognize the legs).
6. **Arc account layer** — Circle Modular (passkey) Wallet on Arc Testnet, USDC balance + USDC-gas (Paymaster), unified NAV across legs (= Arc **Target B**). Note: **LI.FI Arc→Polygon is verified dead** (`get-connections` returns `{connections:[]}`), so a direct Circle **CCTP hop Arc↔Polygon = stretch**.

## Data flow (Approach B+)

```
Browse → data service (Polymarket + Uniswap /quote + equities API + analyst band; Kalshi optional panel) → dashboard + AI Sentiment Gap
Enter  → LI.FI SDK getContractCallsQuote (source: Ethereum/Base USDC → dest: EnterBasket on Polygon, one signature)
       → Composer: swap → bridge → EnterBasket → {neg-risk YES+NO set + asset leg} into user wallet
       → Uniswap $7k = SEPARATE standalone /swap (own tx hash)
Account→ NAV/PnL surfaced on Arc (account/NAV layer only)
Exit   → sell legs (MVP) / UniswapX intent (stretch)
```

## The three architectural approaches

| | What it is | Arc track fit | Risk |
|---|---|---|---|
| **B+ — Polygon execution + Arc account + LI.FI from ETH/Base** ⭐ chosen | Real neg-risk split + asset leg execute on **Polygon mainnet (137)** (real tx ids, tiny $1–5); **LI.FI entry from Ethereum (1) / Base (8453)** → Polygon; **Arc Testnet (5042002) = account/NAV layer only** (= Target B). Dev/sim on a Tenderly VNet fork of Polygon | **Best** — Target B; clean Polygon execution | Low–medium |
| **A — Arc-origin LI.FI route** | Same legs but LI.FI bridges **from Arc USDC** cross-chain | Would also hit Target A | ❌ **Arc-origin route verified dead** — LI.FI Arc→Polygon `get-connections` = `{connections:[]}`; **feature-flag only** |
| **C — Arc-native synthetic positions** | Represent positions on Arc | — | ❌ Rejected — makes us the venue, breaks non-custodial / tap-real-markets |

**Decision:** ship **B+** — Polygon execution + Arc as the account/NAV layer + LI.FI entry from Ethereum/Base. Approach A's Arc-origin LI.FI route is verified dead and kept behind a feature flag only; a separate Circle CCTP hop Arc↔Polygon is the stretch path to revive Target A.

## MVP ↔ Stretch split

**MVP:** one theme (AI) · dashboard with live odds + asset price + ≥1 AI Sentiment Gap pairing · one-signature `EnterBasket` (real neg-risk split in USDC.e + real asset leg) · a SEPARATE standalone Uniswap `/swap` ($7k tx) · Arc passkey account + USDC balance/gas + unified NAV · basic exit.

**Stretch (priority order):** agentic "build me a basket for `<theme>`" (LI.FI Agentic $2k, **Day-2 only**) → UniswapX gasless exit → more themes → a separate Circle CCTP hop Arc↔Polygon (to revive Target A) → BigQuery historical divergence analytics → on-chain basket registry → v4 hook for a basket pool.
