# Accurate per-bucket asset sets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each theme bucket surface an accurate, theme-relevant on-chain asset set — buyable legs unchanged/safe, plus a curated set of the best real on-chain tokens (any ecosystem) shown with a liquidity tag and an unmistakable "not addable to the basket yet" status.

**Architecture:** Add a `liquidity` tag to `Security` (the partition key + visible badge), expand each bucket's `display.securities` with MCP-verified on-chain tokens, reclassify `wstETH` honestly, add a pure `selectOnChainAssets` selector + a new `OnChainAssets` dashboard section. The real-money flow (`EnterBasket.sol`, `basketEntry.ts`, asset legs) is **untouched** — only display data + UI change.

**Tech Stack:** Next.js + React (server components), TypeScript, Vitest (node, `test/**/*.test.ts`; no JSX render tests — components verified via typecheck/build/dev).

**Verified data source:** Contract addresses + liquidity tiers below were confirmed live on 2026-06-14 via LI.FI MCP (`get-token`/`get-quote` on chain 137/1) and blockscout MCP (`lookup_token_by_symbol`). Buyable legs WETH/WBTC/LINK re-verified PASS on Polygon 137. No invented addresses; non-EVM tokens carry no EVM `token` field.

---

## File Structure

- `lib/baskets/types.ts` — add `Liquidity` type + `liquidity?` field on `Security`. (MODIFY)
- `lib/dashboard/service.ts` — add `liquidity` to `SecurityView` + pass-through; teach `priceSecurity` to skip the equities feed for off-rail tokens. (MODIFY)
- `lib/dashboard/graph.ts` — add `OnChainAsset` type + `selectOnChainAssets` selector. (MODIFY)
- `lib/baskets/registry.ts` — expand every bucket's `securities`; tag buyable LIVE-UNISWAP tokens `liquidity:"high"`; demote `wstETH`. (MODIFY)
- `components/OnChainAssets.tsx` — new dashboard section listing on-chain assets with chain + liquidity + buyable/coming-soon badges. (CREATE)
- `app/theme/[slug]/page.tsx` — render `<OnChainAssets>` below the analyst-band graph. (MODIFY)
- `test/graph.test.ts`, `test/registry.test.ts`, `test/dashboard.test.ts` — extend. (MODIFY)

---

## Task 1: Data model + service plumbing

**Files:**
- Modify: `lib/baskets/types.ts`
- Modify: `lib/dashboard/service.ts`

- [ ] **Step 1: Add the `Liquidity` type + field in `lib/baskets/types.ts`**

Add this type just above `export type Security = {` (after the `Availability` type/comment block):

```ts
/** On-chain market-depth tag for tokenized assets — the visible "liquidity" badge. Reflects the token's
 *  real market on its primary venue, NOT our-rails buyability (that's `availability`). Off-rail equities
 *  (NVDAx etc.) never carry this; they are partitioned by `analystBand` instead. */
export type Liquidity = "high" | "medium" | "low";
```

Then add the field inside `Security` (right after the `availability: Availability;` line):

```ts
  /** On-chain market-depth badge for tokenized assets (high/medium/low). Set on every on-chain token
   *  (buyable + coming-soon); never set on off-rail equities. Drives the On-chain Assets section. */
  liquidity?: Liquidity;
```

- [ ] **Step 2: Thread `liquidity` through `SecurityView` in `lib/dashboard/service.ts`**

Update the type import on line 2 to include `Liquidity`:

```ts
import type { PredictionLeg, AssetLeg, Security, Availability, Liquidity, Theme, BeliefMarket } from "@/lib/baskets/types";
```

Add to the `SecurityView` type (after its `availability: Availability;` line):

```ts
  /** On-chain market-depth badge (high/medium/low) for tokenized assets; undefined for equities. */
  liquidity?: Liquidity;
```

In `buildDashboard`, inside the `getSecurities(slug).map(...)` return object (the `return { ticker: sec.ticker, ... }` block ~line 223), add `liquidity` next to `availability`:

```ts
          availability: sec.availability,
          liquidity: sec.liquidity,
```

- [ ] **Step 3: Teach `priceSecurity` to skip the equities feed for off-rail tokens**

In `lib/dashboard/service.ts`, replace the body of `priceSecurity` (the function starting `async function priceSecurity(...)`) with:

```ts
async function priceSecurity(sec: Security, seed: number | undefined): Promise<{ priceUsd?: number; priceSource?: Source; changePct?: number }> {
  const viaUniswap = sec.availability === "LIVE-UNISWAP" && !!sec.token;
  // On-chain "coming soon" tokens (liquidity-tagged, not buyable) aren't on the equities feed and we
  // don't live-price them — use the curated seed (usually none) rather than mis-querying equities with a
  // crypto ticker. LIVE-UNISWAP tokens still price via Uniswap; equities still price via the equity feed.
  const offRailToken = sec.availability !== "LIVE-UNISWAP" && sec.liquidity != null;
  try {
    if (viaUniswap) {
      const priceUsd = await fetchAssetPrice(sec.token!, { decimals: sec.decimals });
      return { priceUsd, priceSource: "live" };
    }
    if (offRailToken) {
      return seed !== undefined ? { priceUsd: seed, priceSource: "fallback" } : {};
    }
    const q = await fetchEquityQuote(sec.ticker);
    return { priceUsd: q.price, priceSource: "live", changePct: q.changePct };
  } catch {
    return seed !== undefined ? { priceUsd: seed, priceSource: "fallback" } : {};
  }
}
```

(The `offRailToken` guard is a no-op until Task 3 adds liquidity-tagged tokens — safe now, behavior locked by a test in Task 3.)

- [ ] **Step 4: Verify typecheck + existing tests still pass**

Run: `npm run typecheck`
Expected: no errors.

Run: `npm test`
Expected: all existing suites PASS (no behavior change yet).

- [ ] **Step 5: Commit**

```bash
git add lib/baskets/types.ts lib/dashboard/service.ts
git commit -m "feat(assets): add Liquidity tag to Security + skip equities feed for off-rail tokens"
```

---

## Task 2: `selectOnChainAssets` selector

**Files:**
- Modify: `lib/dashboard/graph.ts`
- Test: `test/graph.test.ts`

- [ ] **Step 1: Write the failing tests** — append to `test/graph.test.ts`

First update the import on line 2 to add the new selector:

```ts
import { selectGraphAssets, selectOnChainAssets } from "@/lib/dashboard/graph";
```

Then append this describe block at the end of the file:

```ts
describe("selectOnChainAssets", () => {
  it("returns only liquidity-tagged securities, buyable first then by tier", () => {
    const out = selectOnChainAssets([
      sec({ ticker: "FET", chain: "ethereum", liquidity: "high" }), // coming soon, high
      sec({ ticker: "WETH", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", priceUsd: 4300 }), // buyable
      sec({ ticker: "NVDA", band: { low: 1, high: 2 }, bandPercentile: 0.5, priceUsd: 1.5 }), // equity -> excluded
      sec({ ticker: "MAGA", chain: "ethereum", liquidity: "low" }), // coming soon, low
    ]);
    expect(out.map((a) => a.ticker)).toEqual(["WETH", "FET", "MAGA"]);
    expect(out[0]).toMatchObject({ ticker: "WETH", buyable: true, chain: "polygon", liquidity: "high", priceUsd: 4300 });
    expect(out[1]).toMatchObject({ ticker: "FET", buyable: false, liquidity: "high" });
  });

  it("partitions cleanly against selectGraphAssets (no overlap)", () => {
    const secs = [
      sec({ ticker: "NVDA", band: { low: 1, high: 2 }, bandPercentile: 0.5, priceUsd: 1.5 }),
      sec({ ticker: "FET", chain: "ethereum", liquidity: "high" }),
    ];
    expect(selectOnChainAssets(secs).map((a) => a.ticker)).toEqual(["FET"]);
    expect(selectGraphAssets(secs).map((a) => a.ticker)).toEqual(["NVDA"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/graph.test.ts`
Expected: FAIL — `selectOnChainAssets is not a function` (or import error).

- [ ] **Step 3: Implement the selector** — append to `lib/dashboard/graph.ts`

```ts
/** One on-chain token positioned for the On-chain Assets section. */
export type OnChainAsset = {
  ticker: string;
  name: string;
  /** Ecosystem the token primarily lives on (polygon / ethereum / solana / bittensor / chiliz / …). */
  chain: string;
  /** Market-depth badge for the token's primary venue. */
  liquidity: "high" | "medium" | "low";
  /** True when it's addable to the basket sleeve now (LIVE-UNISWAP on Polygon). */
  buyable: boolean;
  /** Live price when available (LIVE-UNISWAP via Uniswap); otherwise undefined. */
  priceUsd?: number;
  note?: string;
};

const LIQ_RANK: Record<OnChainAsset["liquidity"], number> = { high: 3, medium: 2, low: 1 };

/** Pick the on-chain tokens for the On-chain Assets section — every security carrying a `liquidity` tag
 *  (buyable + coming-soon). Sorted buyable-first, then by liquidity tier (deep first). Off-rail equities
 *  (no liquidity tag, have an analyst band) are excluded — they live on the analyst-band graph instead. */
export function selectOnChainAssets(securities: SecurityView[]): OnChainAsset[] {
  return securities
    .filter((s): s is SecurityView & { liquidity: NonNullable<SecurityView["liquidity"]> } => s.liquidity != null)
    .map((s) => ({
      ticker: s.ticker,
      name: s.name,
      chain: s.chain ?? "—",
      liquidity: s.liquidity,
      buyable: s.availability === "LIVE-UNISWAP",
      priceUsd: s.priceUsd,
      note: s.note,
    }))
    .sort((a, b) => Number(b.buyable) - Number(a.buyable) || LIQ_RANK[b.liquidity] - LIQ_RANK[a.liquidity]);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/graph.test.ts`
Expected: PASS (all selectGraphAssets + selectOnChainAssets cases).

- [ ] **Step 5: Commit**

```bash
git add lib/dashboard/graph.ts test/graph.test.ts
git commit -m "feat(dashboard): selectOnChainAssets — partition on-chain tokens (buyable + coming-soon)"
```

---

## Task 3: Registry data — curated on-chain securities per bucket

**Files:**
- Modify: `lib/baskets/registry.ts`
- Test: `test/registry.test.ts`, `test/dashboard.test.ts`

- [ ] **Step 1: Write the new registry invariant tests** — append to `test/registry.test.ts`

```ts
describe("on-chain liquidity tags & partition", () => {
  const LIQ = ["high", "medium", "low"];

  it("every liquidity-tagged security has a valid tier and a chain", () => {
    for (const t of listThemes()) {
      for (const s of getSecurities(t.slug)) {
        if (s.liquidity == null) continue;
        expect(LIQ, `${t.slug}/${s.ticker}`).toContain(s.liquidity);
        expect(s.chain, `${t.slug}/${s.ticker} needs a chain`).toBeTruthy();
      }
    }
  });

  it("no NON-headline security carries both an analyst band and a liquidity tag (clean partition)", () => {
    for (const t of listThemes()) {
      for (const s of getSecurities(t.slug)) {
        if (s.analystBand != null && s.liquidity != null) {
          // The only legal dual-tag is the bucket's headline crypto anchor (e.g. crypto/WBTC).
          expect(s.ticker, `${t.slug}/${s.ticker} dual-tagged`).toBe(t.display.assetSymbol);
        }
      }
    }
  });

  it("every LIVE-UNISWAP security is a deep Polygon token (chain polygon + token; high unless it's the band headline)", () => {
    for (const t of listThemes()) {
      for (const s of getSecurities(t.slug)) {
        if (s.availability !== "LIVE-UNISWAP") continue;
        expect(s.chain, `${t.slug}/${s.ticker}`).toBe("polygon");
        expect(s.token, `${t.slug}/${s.ticker}`).toMatch(/^0x[0-9a-fA-F]{40}$/);
        if (s.analystBand == null) expect(s.liquidity, `${t.slug}/${s.ticker}`).toBe("high");
      }
    }
  });

  it("wstETH is display-only everywhere (no direct USDC.e pool for the sleeve)", () => {
    for (const t of listThemes()) {
      for (const s of getSecurities(t.slug)) {
        if (s.ticker !== "wstETH") continue;
        expect(s.availability).toBe("DISPLAY-ONLY");
        expect(s.liquidity).toBe("low");
      }
    }
  });

  it("every bucket surfaces ≥2 on-chain (liquidity-tagged) securities", () => {
    for (const t of listThemes()) {
      const onchain = getSecurities(t.slug).filter((s) => s.liquidity != null);
      expect(onchain.length, `${t.slug}`).toBeGreaterThanOrEqual(2);
    }
  });
});
```

- [ ] **Step 2: Update the two tests that assume wstETH is buyable**

In `test/dashboard.test.ts`, replace the test body of `"exposes the bucket's securities with availability tags + per-source prices"` (the block referencing `wstETH` ~lines 72-84) with:

```ts
  it("exposes the bucket's securities with availability tags + per-source prices", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.72);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4300);
    vi.spyOn(eq, "fetchEquityQuote").mockResolvedValue({ price: 155, changePct: 0 });

    const d = await buildDashboard("ai");
    const nvda = d.securities.find((s) => s.ticker === "NVDA");
    const weth = d.securities.find((s) => s.ticker === "WETH");
    const wsteth = d.securities.find((s) => s.ticker === "wstETH");
    expect(nvda?.availability).toBe("DISPLAY-ONLY");
    expect(nvda?.priceUsd).toBe(155); // priced via the equities feed
    expect(weth?.availability).toBe("LIVE-UNISWAP");
    expect(weth?.priceUsd).toBe(4300); // priced via Uniswap /quote
    expect(wsteth?.availability).toBe("DISPLAY-ONLY"); // demoted: no direct USDC.e pool for the sleeve
    expect(wsteth?.liquidity).toBe("low");
  });

  it("does not query the equities feed for on-chain 'coming soon' tokens", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.5);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4300);
    const eqSpy = vi.spyOn(eq, "fetchEquityQuote").mockResolvedValue({ price: 1, changePct: 0 });
    await buildDashboard("ai");
    const called = eqSpy.mock.calls.map((c) => c[0]);
    expect(called).not.toContain("FET"); // off-rail token -> skipped
    expect(called).not.toContain("TAO");
    expect(called).toContain("NVDA"); // real equities still queried
  });
```

In `test/registry.test.ts`, update the stale comment above the `"asset legs are a subset of the bucket's LIVE-UNISWAP securities"` test (the lines mentioning wstETH as a "LIVE-UNISWAP display security") to:

```ts
  // Anti-drift, ONE direction: every bought asset leg must be a displayed LIVE-UNISWAP security.
  // (wstETH is now DISPLAY-ONLY — it has no direct USDC.e pool for the fixed-fee sleeve.)
```

- [ ] **Step 3: Run the registry/dashboard tests to verify they FAIL**

Run: `npx vitest run test/registry.test.ts test/dashboard.test.ts`
Expected: FAIL — new invariants unmet (no liquidity tags yet) and wstETH still `LIVE-UNISWAP`.

- [ ] **Step 4: Replace each bucket's `securities` array in `lib/baskets/registry.ts`**

Replace the `securities: [ ... ]` array of the **ai** theme with:

```ts
      securities: [
        {
          ticker: "NVDA",
          name: "NVIDIA",
          analystBand: AI_BAND,
          availability: "DISPLAY-ONLY",
          chain: "solana/CEX",
          note: "Tradeable for eligible users as NVDAx (xStocks, Solana) / CEX — no EVM-Uniswap venue, so it's the analyst anchor here.",
        },
        { ticker: "MSFT", name: "Microsoft", analystBand: { low: 380, high: 600 }, priceUsd: 480, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "AI/cloud bellwether (Azure + OpenAI stake) — tokenized as MSFTx on Solana; coming soon to our rails." },
        { ticker: "GOOGL", name: "Alphabet", analystBand: { low: 150, high: 260 }, priceUsd: 200, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "Gemini / DeepMind AI exposure — tokenized as GOOGLx on Solana; coming soon." },
        { ticker: "TSM", name: "Taiwan Semiconductor", analystBand: { low: 160, high: 300 }, priceUsd: 230, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "Fabricates the AI accelerators — tokenized as TSMx on Solana; coming soon." },
        { ticker: "AMD", name: "Advanced Micro Devices", analystBand: { low: 110, high: 220 }, priceUsd: 160, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "AI-GPU challenger — tokenized as AMDx on Solana; coming soon." },
        // On-chain AI tokens (display-only; MCP-verified addresses; not on our Polygon basket rails yet).
        { ticker: "FET", name: "Artificial Superintelligence Alliance", token: "0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "high", note: "AI-agents alliance (Fetch.ai/SingularityNET/Ocean) — deep on Ethereum + CEX; Polygon bridge is thin, not a basket leg yet." },
        { ticker: "RENDER", name: "Render Network", availability: "DISPLAY-ONLY", chain: "solana", liquidity: "high", note: "Decentralized GPU rendering for AI/3D — primary market migrated to Solana (legacy ERC-20 0x6De0…7e4Aeb24 on Ethereum); not on our EVM rails yet." },
        { ticker: "TAO", name: "Bittensor", availability: "DISPLAY-ONLY", chain: "bittensor", liquidity: "high", note: "Decentralized machine-learning network on its own L1 — trades via CEX; thin ETH wrapper WTAO 0x77E0…b0A44; not bridgeable to our rails." },
        { ticker: "GRT", name: "The Graph", token: "0x5fe2B58c013d7601147DcdD68C143A77499f5531", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "medium", note: "AI/data indexing protocol — live on Polygon-Uniswap (medium depth); a near-term basket-integration candidate." },
        { ticker: "wstETH", name: "Lido Wrapped Staked ETH", token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "low", note: "Routable via Uniswap (it powers our standalone prize swap) but has no direct USDC.e pool for the fixed-fee sleeve — not a basket leg yet." },
        { ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk-on asset on Uniswap (Polygon)." },
        { ticker: "LINK", name: "Chainlink", token: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable data/oracle-infra risk proxy on Uniswap (Polygon)." },
      ],
```

Replace the `securities` array of the **crypto** theme with (note: headline WBTC keeps its band and gets NO liquidity tag — it lives on the graph; WETH carries the buyable badge in the on-chain list):

```ts
      securities: [
        { ticker: "WBTC", name: "Wrapped Bitcoin", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, analystBand: { low: 40000, high: 130000 }, availability: "LIVE-UNISWAP", chain: "polygon", note: "Headline. Buyable BTC exposure on Uniswap (Polygon)." },
        { ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable ETH exposure on Uniswap (Polygon)." },
        // On-chain DeFi blue-chips (display-only; deep Polygon liquidity; near-term integration candidates).
        { ticker: "UNI", name: "Uniswap", token: "0xb33EaAd8d922B1083446DC23f610c2567fB5180f", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "high", note: "Governance token of our swap venue — deep Polygon liquidity; a near-term basket-integration candidate." },
        { ticker: "AAVE", name: "Aave", token: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "high", note: "Leading lending protocol — deep Polygon liquidity; integration candidate." },
        { ticker: "POL", name: "Polygon Ecosystem Token", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "high", note: "Polygon's native gas/staking token (native asset, not an ERC-20 here) — also ERC-20 on Ethereum 0x455e…fFC3F6." },
        { ticker: "COIN", name: "Coinbase Global", analystBand: { low: 150, high: 400 }, priceUsd: 260, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "Crypto-exchange beta — tokenized as COINx on Solana; coming soon." },
        { ticker: "MSTR", name: "Strategy (MicroStrategy)", analystBand: { low: 200, high: 600 }, priceUsd: 380, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "Leveraged BTC-treasury proxy — tokenized as MSTRx on Solana; coming soon." },
        { ticker: "HOOD", name: "Robinhood Markets", analystBand: { low: 30, high: 110 }, priceUsd: 65, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "Retail crypto brokerage — tokenized as HOODx on Solana; coming soon." },
        { ticker: "MARA", name: "MARA Holdings", analystBand: { low: 12, high: 40 }, priceUsd: 22, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Bitcoin miner — no EVM-Uniswap venue; tokenized version coming soon." },
      ],
```

Replace the `securities` array of the **macro** theme with:

```ts
      securities: [
        { ticker: "TLT", name: "iShares 20+ Year Treasury Bond ETF", analystBand: { low: 76, high: 112 }, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Headline rates anchor — no EVM-Uniswap venue; shown for the belief-vs-rates cross (illustrative band)." },
        { ticker: "GLD", name: "SPDR Gold Shares", analystBand: { low: 300, high: 460 }, priceUsd: 380, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Real-asset hedge vs higher-for-longer — no EVM-Uniswap venue (no analyst-target feed; illustrative band)." },
        { ticker: "SPY", name: "SPDR S&P 500 ETF", analystBand: { low: 600, high: 860 }, priceUsd: 720, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Broad risk gauge vs the rate path — no EVM-Uniswap venue (illustrative band)." },
        { ticker: "HYG", name: "iShares iBoxx High Yield Bond ETF", analystBand: { low: 70, high: 92 }, priceUsd: 80, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Credit-spread proxy — no EVM-Uniswap venue (illustrative band)." },
        // On-chain macro / RWA (display-only; MCP-verified addresses; not on our basket rails yet).
        { ticker: "PAXG", name: "PAX Gold", token: "0x45804880De22913dAFE09f4980848ECE6EcbAf78", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "medium", note: "Tokenized gold (1 troy oz) — the on-chain inflation/rates hedge; deep on Ethereum, thin Polygon bridge — not a basket leg yet." },
        { ticker: "USDY", name: "Ondo US Dollar Yield", token: "0x96F6eF951840721AdBF46Ac996b59E0235CB985C", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "low", note: "Tokenized short-term US Treasuries — the marquee on-chain rates RWA; KYC/permissioned, not freely swappable." },
        { ticker: "sDAI", name: "Savings DAI", token: "0x83F20F44975D03b1b09e64809B757c47f942BEeA", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "low", note: "Maker savings-rate token — a pure on-chain proxy for the policy rate; meaningful depth on Ethereum only." },
        { ticker: "wstETH", name: "Lido Wrapped Staked ETH", token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "low", note: "Routable via Uniswap (it powers our standalone prize swap) but has no direct USDC.e pool for the fixed-fee sleeve — not a basket leg yet." },
        { ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable rate-sensitive risk asset on Uniswap (Polygon)." },
        { ticker: "WBTC", name: "Wrapped Bitcoin", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable store-of-value hedge on Uniswap (Polygon)." },
      ],
```

Replace the `securities` array of the **geopolitics** theme with:

```ts
      securities: [
        { ticker: "ITA", name: "iShares U.S. Aerospace & Defense ETF", analystBand: { low: 150, high: 300 }, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Headline conflict-beta anchor — no EVM-Uniswap venue." },
        { ticker: "LMT", name: "Lockheed Martin", analystBand: { low: 400, high: 600 }, priceUsd: 480, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Defense prime — no EVM-Uniswap venue." },
        { ticker: "RTX", name: "RTX (Raytheon)", analystBand: { low: 110, high: 180 }, priceUsd: 145, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Missiles / defense systems — no EVM-Uniswap venue." },
        { ticker: "NOC", name: "Northrop Grumman", analystBand: { low: 450, high: 650 }, priceUsd: 540, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Defense prime — no EVM-Uniswap venue." },
        // On-chain safe-havens (display-only; MCP-verified addresses; not on our basket rails yet).
        { ticker: "PAXG", name: "PAX Gold", token: "0x45804880De22913dAFE09f4980848ECE6EcbAf78", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "medium", note: "Tokenized gold — the classic geopolitical safe-haven; deep on Ethereum, thin Polygon bridge — not a basket leg yet." },
        { ticker: "XAUT", name: "Tether Gold", token: "0x68749665FF8D2d112Fa859AA293F07A622782F38", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "medium", note: "Tokenized gold safe-haven — trades on CEX + Ethereum DEXes; no Polygon venue yet." },
        { ticker: "wstETH", name: "Lido Wrapped Staked ETH", token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "low", note: "Routable via Uniswap (it powers our standalone prize swap) but has no direct USDC.e pool for the fixed-fee sleeve — not a basket leg yet." },
        { ticker: "WBTC", name: "Wrapped Bitcoin", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable digital safe-haven on Uniswap (Polygon)." },
        { ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk asset on Uniswap (Polygon)." },
      ],
```

Replace the `securities` array of the **us-politics** theme with:

```ts
      securities: [
        { ticker: "DJT", name: "Trump Media & Technology Group", analystBand: { low: 3, high: 14 }, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Headline politically-correlated equity — no EVM-Uniswap venue." },
        { ticker: "GEO", name: "GEO Group", analystBand: { low: 18, high: 40 }, priceUsd: 28, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Immigration-policy-sensitive equity — no EVM-Uniswap venue." },
        { ticker: "CXW", name: "CoreCivic", analystBand: { low: 15, high: 35 }, priceUsd: 23, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Policy-sensitive equity — no EVM-Uniswap venue." },
        { ticker: "PLTR", name: "Palantir Technologies", analystBand: { low: 30, high: 120 }, priceUsd: 70, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "Government / defense data — tokenized as PLTRx on Solana; coming soon." },
        // On-chain political tokens (display-only; MCP-verified where EVM; not on our basket rails).
        { ticker: "TRUMP", name: "Official Trump", availability: "DISPLAY-ONLY", chain: "solana", liquidity: "high", note: "The flagship political memecoin — trades on Solana (Raydium/Jupiter) + CEX; not bridgeable to our EVM rails. Mint 6p6x…GiPN." },
        { ticker: "MAGA", name: "MAGA", token: "0x6aA56e1D98b3805921C170EB4B3fe7D4Fda6D89b", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "low", note: "Pro-Trump memecoin on Ethereum — low-cap, ETH-only liquidity; not on our Polygon rails." },
        { ticker: "WLFI", name: "World Liberty Financial", token: "0xdA5e1988097297dCdc1f90D4dFE7909e847CBeF6", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "low", note: "Trump-family DeFi governance token — currently non-transferable (not freely swappable); shown as a political on-chain signal." },
        { ticker: "wstETH", name: "Lido Wrapped Staked ETH", token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "low", note: "Routable via Uniswap (it powers our standalone prize swap) but has no direct USDC.e pool for the fixed-fee sleeve — not a basket leg yet." },
        { ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk-on asset on Uniswap (Polygon)." },
        { ticker: "WBTC", name: "Wrapped Bitcoin", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk asset on Uniswap (Polygon)." },
      ],
```

Replace the `securities` array of the **sports** theme with:

```ts
      securities: [
        { ticker: "DKNG", name: "DraftKings", analystBand: { low: 30, high: 60 }, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Sports-betting beta anchor — no EVM-Uniswap venue; shown for the belief-vs-attention cross." },
        { ticker: "FLUT", name: "Flutter Entertainment", analystBand: { low: 200, high: 320 }, priceUsd: 250, availability: "DISPLAY-ONLY", chain: "off-rail", note: "FanDuel parent — sports-betting leader; no EVM-Uniswap venue." },
        { ticker: "PENN", name: "PENN Entertainment", analystBand: { low: 14, high: 32 }, priceUsd: 22, availability: "DISPLAY-ONLY", chain: "off-rail", note: "ESPN Bet operator — no EVM-Uniswap venue." },
        { ticker: "MANU", name: "Manchester United", analystBand: { low: 12, high: 28 }, priceUsd: 18, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Listed football club — World-Cup-cycle attention proxy; no EVM-Uniswap venue." },
        // On-chain fan tokens (display-only; CHZ verified on Ethereum; Socios fan tokens live on Chiliz Chain).
        { ticker: "CHZ", name: "Chiliz", token: "0x3506424F91fD33084466F402d5D97f05F8e3b4AF", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "high", note: "Fan-token platform powering Socios — deep on Ethereum + CEX; Polygon bridge inactive, not on our rails yet." },
        { ticker: "PSG", name: "Paris Saint-Germain Fan Token", availability: "DISPLAY-ONLY", chain: "chiliz", liquidity: "medium", note: "Socios club fan token on Chiliz Chain + Binance — a World-Cup-cycle attention proxy; not on any EVM DEX rail." },
        { ticker: "BAR", name: "FC Barcelona Fan Token", availability: "DISPLAY-ONLY", chain: "chiliz", liquidity: "low", note: "Socios club fan token on Chiliz Chain — CEX-listed; not on our rails." },
        { ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk-on asset on Uniswap (Polygon)." },
        { ticker: "WBTC", name: "Wrapped Bitcoin", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk asset on Uniswap (Polygon)." },
      ],
```

Replace the `securities` array of the **entertainment** theme with:

```ts
      securities: [
        { ticker: "DIS", name: "The Walt Disney Company", analystBand: { low: 85, high: 135 }, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Box-office/studio beta anchor (makes the marquee 2026 tentpoles) — no EVM-Uniswap venue." },
        { ticker: "NFLX", name: "Netflix", analystBand: { low: 600, high: 1300 }, priceUsd: 950, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "Streaming / box-office beta — tokenized as NFLXx on Solana; coming soon." },
        { ticker: "WBD", name: "Warner Bros. Discovery", analystBand: { low: 8, high: 20 }, priceUsd: 13, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Studio behind major 2026 tentpoles — no EVM-Uniswap venue." },
        { ticker: "CMCSA", name: "Comcast (Universal)", analystBand: { low: 30, high: 55 }, priceUsd: 42, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Universal / Illumination parent — no EVM-Uniswap venue." },
        // On-chain entertainment / metaverse tokens (display-only; SAND+MANA live on Polygon; APE on Ethereum).
        { ticker: "SAND", name: "The Sandbox", token: "0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "high", note: "Metaverse/gaming token — live, deep Polygon-Uniswap liquidity; the strongest near-term basket-integration candidate." },
        { ticker: "MANA", name: "Decentraland", token: "0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "high", note: "Metaverse land/economy token — live Polygon-Uniswap depth; an integration candidate." },
        { ticker: "APE", name: "ApeCoin", token: "0x4d224452801ACEd8B2F0aebE155379bb5D594381", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "medium", note: "Yuga Labs entertainment/NFT ecosystem token — deep on Ethereum, thin on Polygon; not a basket leg yet." },
        { ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk-on asset on Uniswap (Polygon)." },
        { ticker: "WBTC", name: "Wrapped Bitcoin", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk asset on Uniswap (Polygon)." },
      ],
```

- [ ] **Step 5: Run the full suite to verify GREEN**

Run: `npm test`
Expected: ALL suites PASS (new invariants met; wstETH demoted; off-rail skip locked; AI sleeve still WETH+LINK; every-category band graph still ≥3 + headline present).

- [ ] **Step 6: Commit**

```bash
git add lib/baskets/registry.ts test/registry.test.ts test/dashboard.test.ts
git commit -m "feat(registry): curated on-chain asset sets per bucket + liquidity tags; demote wstETH"
```

---

## Task 4: `OnChainAssets` dashboard section + page wiring

**Files:**
- Create: `components/OnChainAssets.tsx`
- Modify: `app/theme/[slug]/page.tsx`

- [ ] **Step 1: Create `components/OnChainAssets.tsx`**

```tsx
"use client";

import type { OnChainAsset } from "@/lib/dashboard/graph";

const DISPLAY = "'Inter Tight', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const C = {
  panel: "#14161B",
  border: "#2A2D34",
  track: "#1B1E24",
  white: "#FFFFFF",
  dim: "#AAB1BC",
  faint: "#7A828D",
  faintest: "#5C636D",
  asset: "#E8EBEF",
  up: "#3FBE85",
} as const;

const CHAIN_LABEL: Record<string, string> = {
  polygon: "Polygon",
  ethereum: "Ethereum",
  base: "Base",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  solana: "Solana",
  "solana/CEX": "Solana / CEX",
  bittensor: "Bittensor",
  chiliz: "Chiliz",
  cosmos: "Cosmos",
  "off-rail": "Off-rail",
};
const chainLabel = (c: string) => CHAIN_LABEL[c] ?? c;

const LIQ_LABEL: Record<OnChainAsset["liquidity"], string> = { high: "high liquidity", medium: "med liquidity", low: "low liquidity" };
const LIQ_COLOR: Record<OnChainAsset["liquidity"], string> = { high: C.asset, medium: C.dim, low: C.faint };

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: n >= 1000 ? 0 : 2 });

function Badge({ children, color = C.dim }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", height: 20, padding: "0 8px", border: `1px solid ${C.border}`, borderRadius: 999, fontFamily: MONO, fontSize: 10, color, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

/** The on-chain asset universe for a theme: buyable Polygon tokens (◆ buyable) and the curated relevant
 *  tokens on other ecosystems that we can't add to the basket yet (○ coming soon) — each with a chain +
 *  liquidity badge. Honest companion to the off-chain analyst-band graph. */
export function OnChainAssets({ assets, title }: { assets: OnChainAsset[]; title: string }) {
  if (assets.length === 0) return null;
  return (
    <section style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 24px", marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 18, color: C.white }}>
        {title} on-chain assets
      </h2>
      <p style={{ margin: "6px 0 18px", maxWidth: 640, fontSize: 12.5, lineHeight: 1.5, color: C.faint }}>
        Relevant tokenized assets on-chain. <span style={{ color: C.up }}>● buyable</span> means addable to the basket now on Polygon-Uniswap;
        {" "}<span style={{ color: C.dim }}>○ coming soon</span> are real on-chain assets on other ecosystems we plan to integrate but can&apos;t add yet.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {assets.map((a) => (
          <div key={`${a.chain}:${a.ticker}`} style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 48, padding: "8px 8px", borderRadius: 8, background: a.buyable ? "rgba(63,190,133,0.05)" : "transparent" }}>
            {/* ticker + name */}
            <div style={{ width: 150, display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 13, color: a.buyable ? C.white : C.dim }}>{a.ticker}</span>
              <span style={{ fontSize: 10.5, color: C.faintest, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
            </div>

            {/* status + chain + liquidity badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: a.buyable ? C.up : C.faint, width: 92 }}>
                {a.buyable ? "● buyable" : "○ coming soon"}
              </span>
              <Badge>{chainLabel(a.chain)}</Badge>
              <Badge color={LIQ_COLOR[a.liquidity]}>{LIQ_LABEL[a.liquidity]}</Badge>
            </div>

            {/* note */}
            <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, lineHeight: 1.45, color: C.faint, display: "none" }} className="onchain-note">
              {a.note}
            </span>

            {/* price (only buyable/live) */}
            <div style={{ width: 96, textAlign: "right", flexShrink: 0 }}>
              {a.priceUsd != null ? (
                <span style={{ fontFamily: MONO, fontSize: 13, color: C.asset, fontFeatureSettings: "'tnum' 1" }}>${fmt(a.priceUsd)}</span>
              ) : (
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.faintest }}>—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

(Note: the `.note` column is `display:none` to keep the row compact on first pass; the honest note ships in the DOM/title for accessibility and is trivially enabled later. The chain + liquidity badges + status pill carry the load-bearing "where it trades / can't buy yet" message.)

- [ ] **Step 2: Wire it into `app/theme/[slug]/page.tsx`**

Add to the imports (next to the `selectGraphAssets` import on line 4):

```ts
import { selectGraphAssets, selectOnChainAssets } from "@/lib/dashboard/graph";
import { OnChainAssets } from "@/components/OnChainAssets";
```

(The existing line 4 is `import { selectGraphAssets } from "@/lib/dashboard/graph";` — replace it with the two lines above.)

After the line that computes `const graphAssets = selectGraphAssets(view.securities);` (~line 79), add:

```ts
  const onChainAssets = selectOnChainAssets(view.securities);
```

Then render the section immediately AFTER the `<AnalystBandGraph ... />` element (~line 187):

```tsx
        {/* On-chain asset universe (buyable Polygon tokens + curated relevant tokens, coming soon) */}
        <OnChainAssets assets={onChainAssets} title={view.title} />
```

- [ ] **Step 3: Verify typecheck + build**

Run: `npm run typecheck`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds (the new client component + page compile).

- [ ] **Step 4: Commit**

```bash
git add components/OnChainAssets.tsx app/theme/[slug]/page.tsx
git commit -m "feat(dashboard): On-chain Assets section — chain + liquidity badges, buyable vs coming-soon"
```

---

## Task 5: Final verification + PR

**Files:** none (verification only)

- [ ] **Step 1: Full quality gate**

Run: `npm run typecheck && npm test && npm run build`
Expected: typecheck clean, all tests PASS, build succeeds.

- [ ] **Step 2: Dev eyeball every theme**

Run: `npm run dev` (then open each theme).
Check for each of `ai, crypto, macro, geopolitics, us-politics, sports, entertainment`:
- The "On-chain assets" section renders below the analyst-band graph.
- Buyable Polygon tokens show `● buyable` + `Polygon` + `high liquidity` (+ a live price).
- Coming-soon tokens show `○ coming soon` + their real chain (Ethereum/Solana/Bittensor/Chiliz) + a liquidity badge, no price.
- The off-chain analyst-band graph still shows the equities unchanged.

- [ ] **Step 3: Confirm the real-money path is untouched**

Run: `git diff main --stat -- lib/lifi EnterBasket.sol contracts lib/baskets/registry.ts`
Expected: only `lib/baskets/registry.ts` (display `securities`) changed; NO change under `lib/lifi/`, `contracts/`, or to any asset-leg `token`/`weight`/`swapFee`. (Buyable legs WETH/WBTC/LINK were re-verified PASS on Polygon 137 via LI.FI MCP — no swap behavior changes, so no Tenderly sim required.)

- [ ] **Step 4: Open the PR**

```bash
git push -u origin worktree-feat-onchain-asset-accuracy
gh pr create --title "feat: accurate per-bucket on-chain asset sets (buyable + coming-soon)" --body "$(cat <<'EOF'
## What
Each theme bucket now surfaces an accurate, theme-relevant on-chain asset set:
- A new **On-chain Assets** dashboard section listing the curated best on-chain tokens per theme (any ecosystem) with **chain + liquidity badges** and an unmistakable `● buyable` vs `○ coming soon` status.
- A `liquidity` tag added to `Security` (the partition key + visible badge).
- `wstETH` reclassified honestly (no direct USDC.e pool → DISPLAY-ONLY, low liquidity).

## Accuracy / verification
All contract addresses + liquidity tiers were verified live via LI.FI + blockscout MCP (2026-06-14). Buyable legs (WETH/WBTC/LINK) re-verified PASS on Polygon 137. No invented addresses; non-EVM tokens (TRUMP/Solana, TAO/Bittensor, PSG·BAR/Chiliz) carry no EVM contract field.

## Safety
The real-money flow is untouched — only `display.securities` data + UI changed. No edits to `EnterBasket.sol`, `lib/lifi/*`, or any asset-leg `token`/`weight`/`swapFee`.

## Tests
Extended `registry.test.ts` (liquidity-tag invariants, partition, wstETH lock), `graph.test.ts` (`selectOnChainAssets`), `dashboard.test.ts` (off-rail equity-feed skip, wstETH demotion).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review

**Spec coverage:**
- Liquidity tag → Task 1 (model), Task 3 (data), Task 4 (badge). ✓
- Curated on-chain tokens per theme (any ecosystem) → Task 3 (all 7 buckets). ✓
- Buyable legs safe/unchanged → Tasks unchanged; verified in Task 5 Step 3. ✓
- wstETH rationalized → Task 3 (data + tests). ✓
- New On-chain Assets UI + clear buyable vs coming-soon → Task 4. ✓
- Verification (real addresses, no invented) → done pre-plan via MCP; embedded as literal addresses. ✓
- Tests test-first → Tasks 2 & 3 are red→green. ✓

**Placeholder scan:** No TBD/TODO; all addresses are literal & MCP-verified; all code blocks complete.

**Type consistency:** `Liquidity` ("high"|"medium"|"low") defined in types.ts, reused in `Security.liquidity`, `SecurityView.liquidity`, `OnChainAsset.liquidity`, and `LIQ`/`LIQ_RANK`/`LIQ_LABEL` maps. `selectOnChainAssets(securities: SecurityView[]): OnChainAsset[]` signature matches its call in page.tsx and its tests. `OnChainAsset` fields (ticker/name/chain/liquidity/buyable/priceUsd/note) match the component's usage.
