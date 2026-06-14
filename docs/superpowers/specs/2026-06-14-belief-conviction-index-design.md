# Belief Conviction Index — design (2026-06-14)

## Problem
The dashboard hero "belief" (the crowd's odds, compared against the asset's analyst-band percentile to
form the Sentiment Gap) is currently just `predViews[0]` — the FIRST prediction market in a category.
That's arbitrary and doesn't represent "the crowd." A category's markets are heterogeneous questions, so
naively averaging YES%s is meaningless. We want a principled, carefully-weighted aggregate over ALL relevant
prediction markets (Polymarket buyable legs + non-buyable + Kalshi) → an honest belief **range**.

## Decisions (locked with user)
- Aggregate across **all relevant markets**, both venues (Polymarket + Kalshi). Relevance-gated: more data
  is better, but only markets genuinely tied to the bucket.
- Belief is shown as a **range** (the crowd's odds as an interval), not a single false-precision point.
- **Fixed** per-venue liquidity reference scales (deterministic, testable).
- Built on the PR #5 cache layer (`lib/adapters/cache.ts`).

## The formula — Theme Conviction Index
Per theme, a curated set of markets `i`, each with: live YES `pᵢ∈[0,1]`, curated **polarity** `±1`
(does YES = bullish-for-theme), curated **relevance** `rᵢ∈(0,1]`, live **liquidity** `Vᵢ≥0`
(volume + open interest), and `venueᵢ`.

**Center (the score):**
- orient: `qᵢ = polarityᵢ == +1 ? pᵢ : 1 − pᵢ`
- weight: `wᵢ = rᵢ · ln(1 + Vᵢ / V̄_venue)`  — `V̄_venue` is a FIXED per-venue scale (e.g. Polymarket
  `$25k`, Kalshi `25k` contracts); log-compressed so one whale market can't dominate.
- **`B = Σ wᵢqᵢ / Σ wᵢ`**

**Range (honest uncertainty), two components:**
- disagreement across markets: `σ_w = sqrt(Σ wᵢ(qᵢ−B)² / Σ wᵢ)`, divided by effective independent count
  `N_eff = (Σwᵢ)² / Σwᵢ²`.
- intrinsic uncertainty: `σ_int = B(1−B) · g(W)` where `W = Σwᵢ` (conviction mass); `g` shrinks as `W`
  grows (thin markets → wider). Widest near 50/50.
- **`half = z · sqrt(σ_w²/N_eff + σ_int²)`**, clamped to `[0,1]` with a small minimum visible width.
- **`belief = { low: clamp(B−half), center: B, high: clamp(B+half) }`**
- Constants (`V̄_venue`, `z`, `g`, minWidth) are tunable and pinned by tests.

**Gap with a range:** the asset band-percentile is a point; belief is a band. `gap = 0` if the percentile
is inside `[low,high]`, else the distance to the nearer edge. Direction = which side it's on.

**Resilience:** resolved/closed markets are dropped (Gamma `closed`/`active`, Kalshi settled) so settled
0/100 can't poison B; any per-market live-fetch failure falls back to its seed `(seedProb, seedVolume)`;
all-offline → seed-weighted B + range. All upstream reads go through the cache layer.

## Components
- `lib/adapters/kalshi.ts` — `fetchKalshiOdds(ticker) → { prob, volume, openInterest }` via
  `api.elections.kalshi.com/trade-api/v2/markets/{ticker}` (yes_bid/ask mid or last_price/100; volume +
  open_interest); cache-wrapped; throws on settled/closed → seed fallback.
- `lib/belief/engine.ts` — pure, unit-tested: `computeBelief(inputs) → { low, center, high, confidence,
  breakdown[] }`. No I/O.
- Registry: per-theme `beliefMarkets: BeliefMarket[]` — `{ venue, id, label, polarity, relevance,
  seedProb, seedVolume }`. Buyable prediction `legs` are belief inputs too (natural polarity + relevance),
  pooled with the extra non-buyable Polymarket + Kalshi markets. Curated as broad as feasible per theme via
  the Polymarket + Kalshi MCPs (live-verified ids). Read-only belief inputs need NO on-chain neg-risk
  verification (unlike buyable legs).
- `lib/dashboard/service.ts` — fetch each belief input's live prob+liquidity (concurrent, cached), call the
  engine, expose `hero.belief = { low, center, high }` + `breakdown`. Gap recomputed for the range.
- UI (`page.tsx`, `AnalystBandGraph.tsx`) — the gap meter's belief marker and the graph's belief overlay
  become a shaded **band** `[low,high]` with the center marked; legend shows the range and (optionally) a
  confidence label. Asset `◆` and "coming soon" treatment unchanged.

## Testing
- `lib/belief/engine.ts`: orientation, fixed-scale weighting, weighted mean, range widening on
  disagreement / thinness / near-50%, range tightening with agreement + liquidity, resolved-market drop,
  seed fallback, all-offline path. Constants pinned.
- `lib/adapters/kalshi.ts`: prob from bid/ask mid, volume+OI, settled/closed → throw.
- Extend the all-category guard: every bucket yields a valid belief range (`0 ≤ low ≤ center ≤ high ≤ 1`),
  ≥2 belief inputs, headline gap well-formed.
- Live API check across all 7 buckets: B + range sane, Kalshi+Polymarket blended, resolved dropped.

## Sequence
0) merge `origin/main` (cache layer; resolve `service.ts`) → tests green.
1) Kalshi adapter. 2) belief engine. 3) registry curation (MCP discovery). 4) wire service + UI band.
5) verify live across all 7 + full suite + typecheck.

## Out of scope (for now)
- Kalshi orderbook-depth weighting (use volume + OI). - Resolution-horizon decay (possible later).
- Changing the buyable basket composition (unchanged).
