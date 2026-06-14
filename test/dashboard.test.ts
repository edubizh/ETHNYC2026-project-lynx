import { describe, it, expect, vi, afterEach } from "vitest";
import * as pm from "@/lib/adapters/polymarket";
import * as us from "@/lib/adapters/uniswap";
import * as eq from "@/lib/adapters/equities";
import { buildDashboard } from "@/lib/dashboard/service";

afterEach(() => vi.restoreAllMocks());

describe("buildDashboard", () => {
  it("composes the hero AI Sentiment Gap from live feeds + lists every leg", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.72);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4300);
    vi.spyOn(eq, "fetchEquityPrice").mockResolvedValue(155); // (155-105)/200 = 0.25 percentile

    const d = await buildDashboard("ai");
    expect(d.title).toBe("AI");
    expect(d.hero.beliefProb).toBeCloseTo(0.72, 6);
    expect(d.hero.beliefSource).toBe("live");
    expect(d.hero.assetSymbol).toBe("NVDA");
    expect(d.hero.assetBandPercentile).toBeCloseTo(0.25, 6);
    expect(d.hero.gapPct).toBeCloseTo(47, 6); // 72 - 25
    expect(d.hero.direction).toBe("belief-higher");

    const preds = d.legs.filter((l) => l.kind === "prediction");
    expect(preds.length).toBe(2);
    expect(d.legs.find((l) => l.kind === "asset")?.priceUsd).toBe(4300);
  });

  it("falls back to VERIFIED seeds (tagged 'fallback') when every live feed is down", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockRejectedValue(new Error("gamma down"));
    vi.spyOn(us, "fetchAssetPrice").mockRejectedValue(new Error("no key"));
    vi.spyOn(eq, "fetchEquityPrice").mockRejectedValue(new Error("no key"));

    const d = await buildDashboard("ai");
    expect(d.hero.beliefSource).toBe("fallback");
    expect(d.hero.beliefProb).toBeCloseTo(0.51, 6); // PRIMARY (OpenAI) seed
    expect(d.hero.equitySource).toBe("fallback");
    expect(d.hero.equityPrice).toBe(165);
    expect(d.legs.find((l) => l.kind === "asset")?.priceSource).toBe("fallback");
  });

  it("exposes the bucket's securities with availability tags + per-source prices", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.72);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4300);
    vi.spyOn(eq, "fetchEquityPrice").mockResolvedValue(155);

    const d = await buildDashboard("ai");
    const nvda = d.securities.find((s) => s.ticker === "NVDA");
    const wsteth = d.securities.find((s) => s.ticker === "wstETH");
    expect(nvda?.availability).toBe("DISPLAY-ONLY");
    expect(nvda?.priceUsd).toBe(155); // priced via the equities feed
    expect(wsteth?.availability).toBe("LIVE-UNISWAP");
    expect(wsteth?.priceUsd).toBe(4300); // priced via Uniswap /quote
  });

  it("includes every sleeve asset leg in the view (AI = WETH + LINK)", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.72);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4300);
    vi.spyOn(eq, "fetchEquityPrice").mockResolvedValue(155);

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
    vi.spyOn(eq, "fetchEquityPrice").mockRejectedValue(new Error("no equities"));

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
    vi.spyOn(eq, "fetchEquityPrice").mockRejectedValue(new Error("no equities feed for WBTC"));

    const d = await buildDashboard("crypto");
    expect(d.hero.assetSymbol).toBe("WBTC");
    expect(d.hero.equitySource).toBe("live"); // came from Uniswap despite the equities feed failing
    expect(d.hero.equityPrice).toBe(64000);
    const wbtc = d.securities.find((s) => s.ticker === "WBTC");
    expect(wbtc?.availability).toBe("LIVE-UNISWAP");
    expect(wbtc?.priceSource).toBe("live");
  });
});
