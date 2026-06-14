# Accurate per-bucket asset sets (buyable + on-chain "coming soon")

**Date:** 2026-06-14
**Branch / worktree:** `worktree-feat-onchain-asset-accuracy`
**Builds on:** PR #6 (multi-asset analyst-band graph + Theme Conviction Index), merged to `main`.

## Problem

Inside a theme dashboard, the assets a user can actually buy into the basket
(`theme.legs` asset legs) are generic crypto — only **WETH / WBTC / LINK**, recycled
across all 7 buckets, with no thematic relevance. Separately, the displayed asset set is
thin: the only relevant non-buyable assets we surface are tokenized **equities** (NVDAx
etc.), and even those render *only* on the analyst-band graph. We surface **no on-chain
tokens** that relate to a theme unless they happen to be a basket leg.

Two concrete accuracy defects:

1. **Generic buyable sleeve** — WETH/WBTC/LINK tell the user nothing about the theme.
2. **No on-chain "coming soon" surface** — the theme page renders securities only through
   `selectGraphAssets`, which requires an `analystBand`. On-chain tokens have no analyst
   band, so any relevant token that is not a basket leg renders **nowhere**. There is also
   a wording bug: `wstETH` is tagged `LIVE-UNISWAP` / "buyable" although its direct USDC.e
   pool is empty (the registry's own Task-0 comment says so).

## Goal

Each bucket surfaces an **accurate, theme-relevant** asset set:

- **Buyable legs** stay safe for the real-money flow (real Polygon USDC.e liquidity +
  confirmed Uniswap V3 fee tier), and become thematic *only where that liquidity genuinely
  exists*.
- **A curated set of the best on-chain tokens** relevant to the theme — on **any**
  ecosystem (Polygon, Ethereum, Solana, Bittensor, Chiliz, …) — shown with a **liquidity
  tag** and an unmistakable "cannot be added to the basket yet" status. We show them
  because they are the eventual integration targets.

**Bar: accuracy over completeness.** Curate the best few per theme; do not dump. Liquidity
does not gate *display* — it gates only what feeds the real-money basket.

## Non-goals

- No change to `EnterBasket.sol` or `lib/lifi/basketEntry.ts` logic. Only registry leg
  *data* changes; the existing per-leg min-out floor already protects any new leg.
- No attempt to make tokenized single-name stocks (NVDAx etc.) buyable — they stay
  display-only equities on the analyst-band graph.
- No live pricing for display-only "coming soon" tokens (a curated seed price is enough;
  the point is to show they exist + are relevant + their liquidity tier).

## Approach (chosen: A)

**A — minimal `Security` extension + one new "On-chain assets" dashboard section.**
Add a liquidity tag to the data model, expand each bucket's `display.securities` with real,
verified on-chain thematic tokens, and add a new dashboard section that lists on-chain
assets with **chain + liquidity + buyable/coming-soon** badges. The existing analyst-band
graph keeps owning off-chain equities.

Rejected alternatives:
- **B — fold tokens into the analyst-band graph.** Tokens have no analyst bull/bear band;
  plotting them would require inventing bands — the opposite of accuracy.
- **C — registry data only, no new UI.** Non-banded on-chain tokens would render nowhere,
  so the new data would be invisible.

## Data model (`lib/baskets/types.ts`)

Extend `Security`:

```ts
/** On-chain market-depth tag for tokenized assets (the visible badge). Not set for
 *  off-rail equities/ETFs, which are badged by `chain` ("off-rail" / "solana/CEX"). */
export type Liquidity = "high" | "medium" | "low";

export type Security = {
  ticker: string;
  name: string;
  token?: `0x${string}`;        // EVM contract (verification + optional pricing)
  decimals?: number;
  priceUsd?: number;
  analystBand?: { low: number; high: number };
  availability: Availability;   // LIVE-UNISWAP | DISPLAY-ONLY
  chain?: string;               // precise: polygon | ethereum | base | arbitrum | optimism | solana | bittensor | chiliz | cosmos | off-rail | solana/CEX
  liquidity?: Liquidity;        // NEW — only for tokenized on-chain assets
  note?: string;                // why-not-buyable + non-EVM contract/venue
};
```

**Availability semantics, rationalized.** `LIVE-UNISWAP` means *addable to the basket
sleeve*: a deep, direct USDC.e→token Uniswap V3 pool on Polygon 137 with a confirmed fee
tier. Everything else on-chain is `DISPLAY-ONLY` with a `chain` + `liquidity` tag.

**Every on-chain security carries a `liquidity` tag** — buyable ones included (the buyable
Polygon tokens get `liquidity:"high"`). This makes the `liquidity` tag the single, crisp
partition key for the UI (see below). Equities never get a `liquidity` tag; they are
partitioned by `analystBand`. The two fields are **mutually exclusive** (a tokenized asset
has `liquidity`; an equity has `analystBand`) — enforced by test.

- **wstETH** is reclassified `DISPLAY-ONLY / chain:"polygon" / liquidity:"low"` with an
  honest note ("on Polygon, but no direct USDC.e pool — priced via multi-hop; not addable
  to the sleeve"). This removes the misleading "buyable" wording.

## Verification (the crux — prove every claim)

- **Every buyable leg** (in `theme.legs`) must return a live LI.FI/Uniswap quote on chain
  137 (USDC.e→token) with a confirmed V3 fee tier (500|3000|10000). Re-verify the existing
  WETH/WBTC/LINK legs; only *promote* a thematic token to a buyable leg if it passes this
  bar (candidates to check: SAND/MANA for entertainment, GRT for AI — Polygon-native).
- **Every on-chain display security** must have a **real, verified contract address** for
  its stated chain (EVM via blockscout `lookup_token_by_symbol` / LI.FI `get-token`;
  non-EVM addresses recorded in `note`). No invented tokens.
- **Liquidity tiers** are assigned from observed pool depth / venue reputation, not guessed
  blindly; the verification evidence is captured in the implementation plan's research log.

## Per-bucket asset sets (candidates — finalized addresses + tiers set during build)

On-chain additions are **curated best-of**, not exhaustive. Existing equities retained.

| Bucket | Buyable legs (verified) | Curated on-chain "coming soon" (chain · liquidity) |
|---|---|---|
| **ai** | WETH, LINK (re-verify; consider GRT) | FET (eth·high), RENDER (solana·high), TAO (bittensor·high), GRT (polygon·med) |
| **crypto** | WBTC, WETH | UNI (eth·high), AAVE (eth·high), LINK (eth·high), POL (polygon·high) |
| **macro** | WETH, WBTC | PAXG (eth·med), Ondo USDY/OUSG (eth·low) |
| **geopolitics** | WBTC, WETH | PAXG (eth·med), XAUT (eth·med) |
| **us-politics** | WETH, WBTC | TRUMP (solana·high), MAGA (eth·low), WLFI (eth·med) |
| **sports** | WETH, WBTC | CHZ (chiliz/eth·med) + 1–2 World-Cup fan tokens (chiliz·low) |
| **entertainment** | WETH, WBTC (consider SAND/MANA) | SAND (polygon·med), MANA (polygon·med), APE (eth·med) |

## UI

**New component** `components/OnChainAssets.tsx`, rendered on the theme page below the
analyst-band graph. Fed by a new pure selector `selectOnChainAssets(securities)` in
`lib/dashboard/graph.ts` that returns every security with a `liquidity` tag (buyable +
coming-soon, sorted buyable-first then by liquidity tier). `selectGraphAssets` continues to
return securities with an `analystBand`. The `liquidity`/`analystBand` mutual exclusivity
means the two sections never show the same security and never drop one. Each row shows:

- ticker + name,
- a **chain badge** (Polygon / Ethereum / Solana / …),
- a **liquidity badge** (`high` / `medium` / `low`),
- a **status pill**: `● buyable · Polygon` (LIVE-UNISWAP) vs `○ coming soon` (DISPLAY-ONLY),
- the honest `note` (e.g. why it can't be added yet).

Copy makes the split unmistakable: *buyable now on Polygon-Uniswap* vs *on-chain elsewhere /
too thin to add yet — integration coming*. Monochrome styling consistent with
`AnalystBandGraph` (filled ◆ = buyable, hollow ○ = coming soon). The analyst-band graph
keeps its equities and its existing "tokenized stocks off our EVM rails" copy.

## Testing (test-first)

Extend `test/registry.test.ts` and add `test/dashboard-graph.test.ts` (or extend existing):

- Every security with a `liquidity` tag has a valid value (`high|medium|low`) and a `chain`.
- No security has BOTH `liquidity` and `analystBand` (mutual-exclusivity / partition lock).
- `LIVE-UNISWAP` ⇒ `chain:"polygon"` + has `token` + `liquidity:"high"`. The existing
  "asset legs ⊆ LIVE-UNISWAP securities" invariant still holds.
- wstETH is `DISPLAY-ONLY` (regression lock for the wording fix).
- Per-bucket weights still sum to 1; `swapFee ∈ {500,3000,10000}`.
- Update the `AI sleeve is WETH + LINK` pin if (and only if) the AI sleeve changes.
- `selectOnChainAssets` returns exactly the `liquidity`-tagged securities (buyable first);
  `selectGraphAssets` returns exactly the `analystBand` securities. Union covers every
  displayed security; intersection is empty.

Plus: `npm run typecheck`, `npm test`, `npm run dev` eyeball of each theme, and a Tenderly
sim of `EnterBasket` for at least one bucket whose sleeve changed (if any leg changes).

## Process

- Isolated worktree `feat-onchain-asset-accuracy` off latest `main`.
- Parallel research subagents to find/verify real contract addresses + liquidity tiers per
  theme via LI.FI / blockscout MCP; results recorded in the plan.
- TDD; registry edits kept localized per theme for merge-safety; one PR.
