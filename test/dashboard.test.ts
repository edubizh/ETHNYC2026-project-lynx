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
    vi.spyOn(eq, "fetchEquityPrice").mockResolvedValue(155); // (155-100)/110 = 0.5 percentile

    const d = await buildDashboard("ai");
    expect(d.title).toBe("AI");
    expect(d.hero.beliefProb).toBeCloseTo(0.72, 6);
    expect(d.hero.beliefSource).toBe("live");
    expect(d.hero.assetSymbol).toBe("NVDA");
    expect(d.hero.assetBandPercentile).toBeCloseTo(0.5, 6);
    expect(d.hero.gapPct).toBeCloseTo(22, 6); // 72 - 50
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
});
