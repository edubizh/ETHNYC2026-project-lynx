# Project-Lynx

**A non-custodial, thematic prediction-market index + intelligence dashboard.** Browse a theme (AI), see the hero **AI Sentiment Gap** — belief-market odds vs. where the AI-correlated asset sits as a **percentile within a published analyst bear/bull band** — then **enter a curated basket in one signature**: a real Polymarket NegRisk neutral YES+NO set (USDC.e) + an on-chain asset leg, delivered **into your own wallet**.

> ETHGlobal New York 2026 · Architecture = **Approach B+** (Polygon `137` execution + Arc `5042002` account/NAV + LI.FI entry from Ethereum/Base). See [`docs/architecture.md`](docs/architecture.md) and [`docs/demo-script.md`](docs/demo-script.md).

## Sponsors (submitting to 5 tracks across 3 sponsors)

- **Arc (Circle)** — account/NAV layer: Modular Wallet **passkey**, USDC balance, **USDC-gas**, unified NAV across Arc + Polygon. → Target A + Target B.
- **LI.FI** — one-signature assembly: `getContractCallsQuote` destination call into `EnterBasket`, funded from **Ethereum/Base**. → Composer + Best UX.
- **Uniswap** — `/quote` price oracle for the dashboard + a **separate standalone** Trading-API `/swap` (the **$7k** artifact). → Best API Integration.

## What's in here

```
lib/            divergence engine · basket registry · data adapters · dashboard composer · config/addresses
app/            Next.js App Router — theme browser, /theme/[slug] dashboard, /api/theme/[slug] data service
components/     DivergencePanel (hero) · AnalystBand · BasketTable · EnterButton (LI.FI) · AccountBar (Arc)
contracts/      Foundry — EnterBasket.sol + a fork test against the REAL NegRiskAdapter on Polygon
lib/uniswap/ + scripts/   standalone Uniswap prize swap (the $7k tx) + its runner
docs/           product/design/decisions + this build's architecture & demo script
```

## Run it

```bash
npm install
cp .env.example .env.local      # fill UNISWAP_API_KEY (hard-fails without it), EQUITIES_API_KEY, CIRCLE_* …
npm test                        # 23 unit tests (vitest)
npm run dev                     # http://localhost:3000  → /theme/ai
# contracts (needs Foundry):
cd contracts && forge test -vv  # fork test against real Polygon NegRiskAdapter
# standalone Uniswap $7k swap (throwaway funded wallet; key from shell env, never committed):
UNISWAP_API_KEY=… POLYGON_RPC=… PRIVATE_KEY=0x… npx tsx scripts/runPrizeSwap.ts
```

## Verification status (honest)

**Verified live / tested this build:**
- ✅ `NegRiskAdapter.col() == USDC.e`; both basket markets unresolved (`getDetermined == false`) — on-chain (blockscout).
- ✅ `getPositionId(questionId, true/false)` **== Gamma clobTokenIds to full 256-bit precision** (cast) — the #1 demo-killer.
- ✅ **Foundry fork test (5/5) against the real NegRiskAdapter on a Polygon fork**: recipient holds BOTH YES+NO outcome tokens AND `EnterBasket` retains ZERO wcol/USDC.e/tokens. Caught a real bug vs. the plan: `EnterBasket` must inherit `ERC1155Holder` or the adapter's `safeBatchTransferFrom` reverts.
- ✅ Live LI.FI connections: Ethereum/Base → Polygon (native USDC) non-empty; **Arc → Polygon `{connections:[]}`** (dead, as designed).
- ✅ API shapes pinned against current docs/SDKs (Uniswap Trading API, `@lifi/sdk@3.6.4`, `@circle-fin/modular-wallets-core@1.0.13`).
- ✅ `next build` green (4 routes); `tsc` clean; 23 vitest tests green.

**Needs credentials / a funded wallet (code complete, run by a human — org policy forbids holding keys):**
- ⏳ Register the **Uniswap Trading API key**; execute the standalone `/swap` → record the real Polygon tx hash for the $7k prize + submit the Developer Feedback Form.
- ⏳ Stand up the **Arc passkey + a real USDC-gas Paymaster tx** (browser WebAuthn).
- ⏳ **Deploy `EnterBasket`** and run a real **LI.FI `executeRoute`** entry from a funded Ethereum/Base wallet; record the tx hashes.

## Recorded tx hashes (fill at the booth)

| Artifact | Chain | Tx hash |
|---|---|---|
| Uniswap standalone `/swap` ($7k) | Polygon 137 | `<record from scripts/runPrizeSwap.ts>` |
| `EnterBasket` entry (via LI.FI) | Polygon 137 | `<record after deploy + executeRoute>` |
| Arc USDC-gas Paymaster tx | Arc 5042002 | `<record from the passkey flow>` |

## Hard constraints (do not relitigate — see `docs/03`)

Tap existing markets (never create our own) · non-custodial (never the venue/fund) · positions to the user's own wallet · the prediction leg uses the permissionless `NegRiskAdapter.splitPosition` neutral-set path, never the operator-gated CLOB · the hero is the **AI Sentiment Gap**, never "implied probability."
