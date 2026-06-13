# Demo script (90s) — Project-Lynx

> **Live fallback:** keep a **pre-funded "already-bridged" Polygon wallet** ready so no beat depends on a
> live cross-chain settlement completing inside 90s. The dashboard renders from verified seeds if a live
> feed is down (every value is tagged `live`/`fallback` in the UI).

1. **Open the AI dashboard** (`/theme/ai`). Point at the **basket legs**: OpenAI-not-IPO (PRIMARY, always-valid) + Anthropic-top-model, both real Polymarket NegRisk markets, plus the on-chain asset leg. Odds are **live from Polymarket Gamma**.
2. **The AI Sentiment Gap fires** — "belief markets price the event at ~51%; NVDA sits at the ~59th percentile of its published analyst bear→bull band — an ~8-point gap." The band is drawn on screen. *Never say "implied probability."* This is the screen nobody else has.
3. **Enter the basket — one signature** (LI.FI). Name the tool: "LI.FI Composer bundles swap → bridge (from Base) → `EnterBasket` on Polygon." Show the **tx IDs**. Fall back to the pre-funded Polygon wallet if the bridge hasn't settled. The minted set is the **neutral YES+NO** — full thematic exposure; **show the "sell to go directional" CTA**.
4. **The standalone Uniswap $7k swap** — show the recorded **real Polygon tx hash** from `scripts/runPrizeSwap.ts` (`/quote` → `/swap`). State clearly it is **separate** from the basket's Sushi-routed asset leg.
5. **Account on Arc** — passkey login, USDC balance, **gas paid in USDC**, **unified NAV** across Arc + Polygon legs. (Arc = account/NAV layer; execution is on Polygon.)
6. **Name each sponsor tool on screen** as it's used (required for judging): Arc Modular Wallet + Paymaster, LI.FI Composer + Widget, Uniswap Trading API `/quote` + `/swap`.

## Custody / compliance framing (own it before a judge raises it)

- **Non-custodial:** positions land in the user's own wallet; we never pool or custody funds.
- **We never create markets:** we layer on Polymarket (on-chain) + the permissionless `NegRiskAdapter.splitPosition` path — not the operator-gated CLOB.
- **No team member touches the Polymarket UI/CLOB on US soil** (markets are `restricted=true`); we interact with the permissionless NegRisk/CTF **protocol layer**.
