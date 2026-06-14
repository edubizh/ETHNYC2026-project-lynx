import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as pm from "@/lib/adapters/polymarket";
import * as us from "@/lib/adapters/uniswap";
import * as eq from "@/lib/adapters/equities";
import * as yh from "@/lib/adapters/yahoo";
import * as ks from "@/lib/adapters/kalshi";
import { buildDashboard } from "@/lib/dashboard/service";
import { selectGraphAssets } from "@/lib/dashboard/graph";
import { listThemes, getHeadlineSecurity } from "@/lib/baskets/registry";

// The hero band calls Yahoo only when the equity price is live; mock it off by default so these
// tests use the hardcoded band (deterministic, no network). Tests override it to assert the live path.
vi.mock("@/lib/adapters/yahoo", () => ({ fetchAnalystBand: vi.fn() }));

beforeEach(() => {
  vi.mocked(yh.fetchAnalystBand).mockRejectedValue(new Error("yahoo off in tests"));
  // Belief feeds default OFF in unit tests → deterministic seed-weighted aggregation, no network.
  vi.spyOn(pm, "fetchMarketVolumes").mockRejectedValue(new Error("volumes off in tests"));
  vi.spyOn(ks, "fetchKalshiOdds").mockRejectedValue(new Error("kalshi off in tests"));
});
afterEach(() => vi.restoreAllMocks());

describe("buildDashboard", () => {
  it("composes the hero AI Sentiment Gap from live feeds + lists every leg", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.72);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4300);
    vi.spyOn(eq, "fetchEquityQuote").mockResolvedValue({ price: 155, changePct: 0 }); // (155-105)/200 = 0.25 percentile

    const d = await buildDashboard("ai");
    expect(d.title).toBe("AI");
    // belief is now an aggregate RANGE (engine math is covered in belief.test.ts) — assert structure here
    expect(d.hero.beliefProb).toBe(d.hero.belief.center);
    expect(d.hero.belief.low).toBeLessThanOrEqual(d.hero.belief.center);
    expect(d.hero.belief.center).toBeLessThanOrEqual(d.hero.belief.high);
    expect(d.hero.beliefSource).toBe("live");
    expect(d.hero.assetSymbol).toBe("NVDA");
    expect(d.hero.assetBandPercentile).toBeCloseTo(0.25, 6);
    expect(Number.isFinite(d.hero.gapPct)).toBe(true);

    const preds = d.legs.filter((l) => l.kind === "prediction");
    expect(preds.length).toBe(2);
    expect(d.legs.find((l) => l.kind === "asset")?.priceUsd).toBe(4300);
  });

  it("uses the LIVE Yahoo analyst band for the hero when the equity price is also live", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.4);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4300);
    vi.spyOn(eq, "fetchEquityQuote").mockResolvedValue({ price: 300, changePct: 0 }); // live price
    vi.mocked(yh.fetchAnalystBand).mockResolvedValue({ low: 200, high: 600 }); // (300-200)/400 = 0.25

    const d = await buildDashboard("ai");
    expect(d.hero.band).toEqual({ low: 200, high: 600 });
    expect(d.hero.assetBandPercentile).toBeCloseTo(0.25, 6);
    expect(d.hero.belief.low).toBeLessThanOrEqual(d.hero.belief.high);
  });

  it("falls back to VERIFIED seeds (tagged 'fallback') when every live feed is down", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockRejectedValue(new Error("gamma down"));
    vi.spyOn(us, "fetchAssetPrice").mockRejectedValue(new Error("no key"));
    vi.spyOn(eq, "fetchEquityQuote").mockRejectedValue(new Error("no key"));

    const d = await buildDashboard("ai");
    expect(d.hero.beliefSource).toBe("fallback");
    expect(Number.isFinite(d.hero.belief.center)).toBe(true); // seed-weighted aggregate, still well-formed
    expect(d.hero.belief.center).toBeGreaterThanOrEqual(0);
    expect(d.hero.belief.center).toBeLessThanOrEqual(1);
    expect(d.hero.equitySource).toBe("fallback");
    expect(d.hero.equityPrice).toBe(165);
    expect(d.legs.find((l) => l.kind === "asset")?.priceSource).toBe("fallback");
  });

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

  it("includes every sleeve asset leg in the view (AI = WETH + LINK)", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.72);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4300);
    vi.spyOn(eq, "fetchEquityQuote").mockResolvedValue({ price: 155, changePct: 0 });

    const d = await buildDashboard("ai");
    const assets = d.legs.filter((l) => l.kind === "asset");
    expect(assets.length).toBe(2);               // WETH + LINK
    expect(assets.every((a) => a.priceUsd === 4300)).toBe(true);
    expect(d.legs.filter((l) => l.kind === "prediction").length).toBe(2);
    expect(d.hero.assetSymbol).toBe("NVDA");      // hero anchor unchanged
  });

  it("falls back to a PER-TOKEN price (not one shared bucket seed) when sleeve quotes degrade", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.165);
    vi.spyOn(us, "fetchAssetPrice").mockRejectedValue(new Error("quote down"));
    vi.spyOn(eq, "fetchEquityQuote").mockRejectedValue(new Error("no equities"));

    const d = await buildDashboard("crypto");
    const assets = d.legs.filter((l) => l.kind === "asset");
    const wbtc = assets.find((a) => a.label.includes("WBTC"));
    const weth = assets.find((a) => a.label.includes("WETH"));
    expect(wbtc?.priceUsd).toBe(64317);
    expect(weth?.priceUsd).toBe(4300); // distinct per-token fallback, NOT the bucket-wide 64317
    expect(weth?.priceSource).toBe("fallback");
  });

  it("prices a crypto bucket's headline via Uniswap /quote, not the equities feed", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.165);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(64000);
    vi.spyOn(eq, "fetchEquityQuote").mockRejectedValue(new Error("no equities feed for WBTC"));

    const d = await buildDashboard("crypto");
    expect(d.hero.assetSymbol).toBe("WBTC");
    expect(d.hero.equitySource).toBe("live"); // came from Uniswap despite the equities feed failing
    expect(d.hero.equityPrice).toBe(64000);
    const wbtc = d.securities.find((s) => s.ticker === "WBTC");
    expect(wbtc?.availability).toBe("LIVE-UNISWAP");
    expect(wbtc?.priceSource).toBe("live");
  });

  it("summarizes the belief inputs (count + venues) and exposes the per-market breakdown", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.515);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4300);
    vi.spyOn(eq, "fetchEquityQuote").mockResolvedValue({ price: 205, changePct: 0 });

    const d = await buildDashboard("ai");
    expect(d.hero.beliefLabel).toMatch(/markets/);
    expect(d.hero.beliefBreakdown.length).toBeGreaterThanOrEqual(2); // ≥ the two AI prediction legs
    expect(d.hero.beliefBreakdown.every((b) => b.weight >= 0)).toBe(true);
  });

  it("exposes a per-security analyst band + momentum for the multi-asset graph", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.72);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4300);
    vi.spyOn(eq, "fetchEquityQuote").mockResolvedValue({ price: 165, changePct: 2.5 });

    const d = await buildDashboard("ai");
    const nvda = d.securities.find((s) => s.ticker === "NVDA")!;
    expect(nvda.band).toEqual({ low: 105, high: 305 });
    expect(nvda.bandPercentile).toBeCloseTo(0.3, 6); // (165-105)/200
    expect(nvda.changePct).toBe(2.5);
  });

  it("uses the LIVE analyst band for EVERY graph security (not just the headline) when its price is live", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.5);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4300);
    vi.spyOn(eq, "fetchEquityQuote").mockResolvedValue({ price: 300, changePct: 1 });
    vi.mocked(yh.fetchAnalystBand).mockResolvedValue({ low: 200, high: 600 }); // (300-200)/400 = 0.25

    const d = await buildDashboard("ai");
    const msft = d.securities.find((s) => s.ticker === "MSFT")!; // a NON-headline graph security
    expect(msft.band).toEqual({ low: 200, high: 600 });
    expect(msft.bandPercentile).toBeCloseTo(0.25, 6);
  });
});

// The product's core claim: every category bridges prediction-market belief → traditional-asset bands.
// This guards ALL categories (incl. any newly added) — the graph must be a real multi-name chart with the
// belief overlay and a non-degenerate hero anchor, even with every live feed down (verified seeds only).
describe("every category bridges prediction belief → traditional-asset bands", () => {
  beforeEach(() => {
    vi.spyOn(pm, "fetchBeliefProb").mockRejectedValue(new Error("offline"));
    vi.spyOn(us, "fetchAssetPrice").mockRejectedValue(new Error("offline"));
    vi.spyOn(eq, "fetchEquityQuote").mockRejectedValue(new Error("offline"));
  });

  for (const t of listThemes()) {
    it(`${t.slug}: belief overlay + a real multi-name band graph (headline interior, no degenerate points)`, async () => {
      const d = await buildDashboard(t.slug);

      // the crowd-belief RANGE that overlays the graph is well-formed for every category
      expect(d.hero.beliefProb).toBe(d.hero.belief.center);
      expect(d.hero.belief.low, `${t.slug} belief.low`).toBeGreaterThanOrEqual(0);
      expect(d.hero.belief.low).toBeLessThanOrEqual(d.hero.belief.center);
      expect(d.hero.belief.center).toBeLessThanOrEqual(d.hero.belief.high);
      expect(d.hero.belief.high, `${t.slug} belief.high`).toBeLessThanOrEqual(1);
      expect(d.hero.beliefBreakdown.length, `${t.slug} belief inputs`).toBeGreaterThanOrEqual(1);
      expect(Number.isFinite(d.hero.gapPct)).toBe(true);
      // the hero anchor sits STRICTLY inside its band — never pinned to an edge / broken
      expect(d.hero.assetBandPercentile, `${t.slug} hero pct saturated`).toBeGreaterThan(0);
      expect(d.hero.assetBandPercentile, `${t.slug} hero pct saturated`).toBeLessThan(1);

      // the multi-asset graph: ≥3 well-formed securities, headline present
      const assets = selectGraphAssets(d.securities);
      expect(assets.length, `${t.slug} graph has only ${assets.length} securities`).toBeGreaterThanOrEqual(3);
      const headline = getHeadlineSecurity(t.slug).ticker;
      expect(assets.some((a) => a.ticker === headline), `${t.slug} graph missing headline ${headline}`).toBe(true);
      for (const a of assets) {
        expect(Number.isFinite(a.priceUsd), `${t.slug}/${a.ticker} non-finite price`).toBe(true);
        expect(a.high, `${t.slug}/${a.ticker} band`).toBeGreaterThan(a.low);
        expect(a.pct).toBeGreaterThanOrEqual(0);
        expect(a.pct).toBeLessThanOrEqual(1);
      }
    });
  }
});
