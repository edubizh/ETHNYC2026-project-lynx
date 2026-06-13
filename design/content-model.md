# Content Model — Buckets, Predictions & Securities

> The data the design renders. A **bucket** is a theme that fuses **prediction markets** (executable, on-chain) with the **tokenized real-world securities of the same narrative** (the legibility/anchor layer). This file defines the bucket shape, the honest availability vocabulary, and the proposed taxonomy. Source: on-chain + Polymarket/Kalshi + Uniswap research pass (2026-06-13).

## The one honest constraint (read first)

As of June 2026, **no tokenized stock is openly Uniswap-tradeable by an ungated / US user** on any EVM chain (xStocks live on Solana; Swarm/Dinari/Ondo are KYC-gated permissioned rails; Mirror/Synthetix synths are dead and on Uniswap's unsupported-tokens blocklist). Therefore:

- **Securities are DISPLAY-ONLY across every bucket.** They make the bucket *legible* — they are the tradfi anchor — but the UI must never imply a one-click "Buy NVDA."
- **The executable instrument is the prediction basket** (real Polymarket NegRisk neutral YES+NO set in USDC.e), plus a **liquid crypto asset leg** (wstETH today) where a bucket has one.
- Every security renders an **availability badge** so honesty is visible (see vocabulary below).

This is a feature for a trust-driven tradfi audience, not a limitation — it is the product being honest about what executes.

## Bucket data shape

```ts
type Availability =
  | "LIVE-UNISWAP"        // genuinely tradeable on Uniswap now (chain noted) — badge: ◆ live · uniswap
  | "TOKENIZED-BUT-GATED" // a token exists but is US-gated / wrong chain / illiquid — badge: ◇ display-only · gated
  | "NO-TOKENIZED-VERSION";// no tradeable tokenized form exists — badge: ◇ display-only (signal)

type Source = "live" | "fallback"; // freshness of any rendered value

type PredictionLeg = {
  label: string;
  gammaMarketId: string;
  conditionId: `0x${string}`;
  questionId: `0x${string}`;
  yesOdds: number;        // 0..1, from Polymarket Gamma (live) or seed (fallback)
  source: Source;
  weight: number;         // basket weight, sums to 1 across executable legs
};

type Security = {
  ticker: string;         // e.g. "NVDA", "LMT"
  name: string;
  priceUsd?: number;      // display price (equities feed); source-tagged
  source?: Source;
  analystBand?: { low: number; high: number }; // bear→bull targets, shown on screen
  bandPercentile?: number;// 0..1 — where price sits in [low,high] (NOT a probability)
  availability: Availability;
  chain?: string;         // where the token (if any) lives
  note?: string;          // e.g. "xStocks on Solana; US-gated"
};

type AssetLeg = {         // the EXECUTABLE on-chain asset (crypto proxy), distinct from display securities
  label: string; token: `0x${string}`; chain: "polygon-137"; weight: number;
};

type SentimentGap = {     // the hero cross
  beliefProb: number;     // 0..1, the bucket's primary prediction leg
  assetBandPercentile: number; // 0..1, the headline security's band percentile
  gapPct: number;         // |belief - percentile| * 100, in points
  direction: "belief-higher" | "asset-higher" | "aligned";
};

type Bucket = {
  slug: string; title: string;
  status: "flagship" | "demo-ready" | "aspirational";
  thesis: string;         // one line
  predictionLegs: PredictionLeg[];
  securities: Security[];
  assetLeg?: AssetLeg;    // the executable crypto proxy, if any
  headlineSecurity: string; // ticker driving the Sentiment Gap
  gap: SentimentGap;
};
```

## Availability badge vocabulary (mandatory)

| Tag | Badge | Meaning | Color |
|---|---|---|---|
| `LIVE-UNISWAP` | `◆ live · uniswap` | tradeable on Uniswap now (chain shown) | amber |
| `TOKENIZED-BUT-GATED` | `◇ display-only · gated` | token exists but US-gated / wrong chain / illiquid | ink-muted |
| `NO-TOKENIZED-VERSION` | `◇ display-only` | no tradeable token; shown as a price signal only | ink-muted |
| value `live` | `● live` | from a live feed this request | green |
| value `fallback` | `○ fallback` | verified seed shown (feed unavailable) | ink-muted |

## Realistic data ranges (for mock fidelity)

- **YES odds:** 0–100% (typical 30–90%). Render mono, e.g. `51%`.
- **Band percentile:** 0–100th (e.g. `59th`).
- **Sentiment Gap:** 0–60 pts (typical 5–25). Render `8 pts`.
- **Prediction legs per bucket:** 2–4. **Securities per bucket:** 1–5.
- **Basket size (demo):** tiny, $1–10 USDC.e. **Weights:** sum to 1.
- **conditionId / questionId:** 0x + 64 hex (mono, truncated `0x3849…dc5e` with copy affordance).
- **tx hash:** 0x + 64 hex, links to Polygonscan.

## Proposed taxonomy — 8 buckets

### Flagship

**1. AI** — `flagship` · matches the live MVP 1:1.
- Thesis: *Belief markets price the AI model race and OpenAI's path to IPO; NVDA is the analyst-banded asset proxy → the AI Sentiment Gap.*
- Prediction legs (live in `lib/baskets/registry.ts`):
  - **OpenAI does NOT IPO by Dec 2026** — gammaId `608368`, conditionId `0x3849…dc5e`, questionId `0xd2c2…bf06`, ~51% YES, weight 0.35 (PRIMARY / always-valid).
  - **Anthropic has the top AI model** — gammaId `631121`, conditionId `0x0811…801e`, questionId `0x3dcd…2901`, ~89.5% YES, weight 0.15.
- Executable asset leg: **wstETH** (`0x03b54A…bCCD`, polygon-137), `LIVE-UNISWAP`, weight 0.5.
- Headline security: **NVDA** — `TOKENIZED-BUT-GATED` (NVDAx on Solana; NVDA.s on Polygon dead) — display-only, analyst band `{low:100, high:210}`.

### Demo-ready (rich live prediction markets + display-able securities)

**2. Crypto** — `demo-ready` · the most honest "co-invest" (the theme *is* the on-chain asset).
- Thesis: *Belief odds on BTC/ETH milestones vs. the actual on-chain asset.*
- Prediction legs: `will-bitcoin-hit-150k-by-june-30-2026` (cond `0xa0f4…3dd5`, ~$20.7M), `…by-december-31-2026` (cond `0x02de…41e8`).
- Securities / asset legs: **wstETH / WETH / WBTC** (polygon-137) — `LIVE-UNISWAP`. No tokenized *stock* involved; the asset is first-class.

**3. Macro / Fed** — `demo-ready` · best Arc Target-A narrative.
- Thesis: *Rate-cut path + recession odds vs. a yield/treasury proxy. Matches Arc's CPI/Fed/jobs examples.*
- Prediction legs (clean negRisk ladder): `will-no-fed-rate-cuts-happen-in-2026` (cond `0xd4e7…8527`, $5.0M), `us-recession-by-end-of-2026` (cond `0xfdc7…105d`, $1.6M). Kalshi cross-panel: `KXFEDDECISION`, `KXCPIYOY`.
- Securities: **SPY / TLT** — `TOKENIZED-BUT-GATED` (SPYx on Solana; Backed bIB01 treasury blocklisted) — display-only. Asset leg: wstETH (or a tokenized-treasury display card).

**4. Geopolitics / Conflict ("Military")** — `demo-ready` (predictions) / securities are the honesty gap.
- Thesis: *Conflict odds + defense & oil — the owner's marquee example.*
- Prediction legs: `will-china-invade-taiwan-before-2027` (cond `0xd9fb…6d4`, $34.6M), `will-russia-invade-a-nato-country-by-june-30-2026` (cond `0x495e…5423`, $3.6M), `putin-out-before-2027` (cond `0x6bd5…0d0d`, $7.3M).
- Securities: **Lockheed (LMT) / RTX / Northrop (NOC)** + **oil majors (XOM/CVX)** → `NO-TOKENIZED-VERSION` (no defense tokenization with an on-chain venue). Oil can show a Kalshi `KXWTI`/`KXBRENTMON` price *signal*. Asset leg: wstETH. **Mock defense/oil as a display/signal card — never as buyable.**

**5. US Politics / 2028** — `demo-ready` · the deepest belief markets on the platform.
- Thesis: *The deepest belief markets; pair with risk-on crypto as the "political-regime" proxy.*
- Prediction legs: `will-gavin-newsom-win-the-2028-democratic-presidential-nomination-568` (cond `0x0f49…9f75`, ~$25.8M), `will-alexandria-ocasio-cortez-…2028…` (cond `0xe6bc…3565`, ~$13.3M).
- Securities: `NO-TOKENIZED-VERSION` (no clean tradfi proxy). Asset leg: wstETH / WETH.

### Aspirational (PM markets thin/moderate, or securities gated/nonexistent)

**6. Big Tech / Companies** — `aspirational`.
- Thesis: *M&A / antitrust odds + big-tech equity proxy.*
- Prediction legs (negRisk TikTok-acquisition field): `will-microsoft-acquire-tiktok…` (cond `0x2cd2…2eaf`), `will-meta-acquire-tiktok…` (cond `0x3e0b…f757`). Moderate volume.
- Securities: **MSFT / META / GOOG** — `TOKENIZED-BUT-GATED` (Solana xStocks / dShares) — display-only.

**7. Energy / Oil** — `aspirational`.
- Thesis: *Oil-price / OPEC odds + energy proxy.* Polymarket thin → Kalshi-sourced (`KXWTI`, `KXBRENTMON`).
- Securities: **XOM / CVX** — `NO-TOKENIZED-VERSION`. Asset leg: wstETH (no good on-chain oil proxy).

**8. Space** — `aspirational`.
- Thesis: *Starship / SpaceX milestones* (Kalshi `KXSPACEXSTARSHIP`/`KXSTARSHIPMARS`; PM thin).
- Securities: SpaceX is private — surfaced on Uniswap's new tokenized-stock list but `TOKENIZED-BUT-GATED` / illiquid → display-only.

## Summary for the designer

- **Co-investable on Uniswap (security buyable): 0 of 8.** Closest to honest co-investment is **Crypto** (theme = on-chain asset).
- **Predictions executable + securities display-only: all 8.**
- **Mock these five first:** AI (flagship), Crypto, Macro/Fed, Geopolitics/Conflict, US Politics. Show the other three as "coming soon"/aspirational in browse.
- The browse grid is **not uniform** — the flagship reads larger; demo-ready and aspirational are visually distinguished (e.g. status chip + dimmed aspirational).
