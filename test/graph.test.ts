import { describe, it, expect } from "vitest";
import { selectGraphAssets } from "@/lib/dashboard/graph";
import type { SecurityView } from "@/lib/dashboard/service";

const sec = (over: Partial<SecurityView>): SecurityView => ({
  ticker: "X",
  name: "X",
  availability: "DISPLAY-ONLY",
  ...over,
});

describe("selectGraphAssets", () => {
  it("keeps only securities that have a band, a percentile, and a price (sorted by percentile desc)", () => {
    const out = selectGraphAssets([
      sec({ ticker: "NVDA", band: { low: 105, high: 305 }, bandPercentile: 0.3, priceUsd: 165 }),
      sec({ ticker: "WETH", availability: "LIVE-UNISWAP", priceUsd: 4300 }), // no band -> excluded
      sec({ ticker: "MSFT", band: { low: 380, high: 620 }, bandPercentile: 0.5, priceUsd: 500 }),
      sec({ ticker: "NOPRICE", band: { low: 1, high: 2 }, bandPercentile: 0.5 }), // no price -> excluded
    ]);
    expect(out.map((a) => a.ticker)).toEqual(["MSFT", "NVDA"]);
  });

  it("maps band bounds, price, percentile; defaults momentum to 0; flags off-rail as coming-soon", () => {
    const [a] = selectGraphAssets([
      sec({ ticker: "NVDA", name: "NVIDIA", band: { low: 105, high: 305 }, bandPercentile: 0.3, priceUsd: 165 }),
    ]);
    expect(a).toMatchObject({
      ticker: "NVDA",
      name: "NVIDIA",
      low: 105,
      high: 305,
      pct: 0.3,
      priceUsd: 165,
      changePct: 0,
      comingSoon: true,
    });
  });

  it("flags LIVE-UNISWAP securities as not coming-soon and carries their momentum", () => {
    const [a] = selectGraphAssets([
      sec({ ticker: "WBTC", availability: "LIVE-UNISWAP", band: { low: 45000, high: 95000 }, bandPercentile: 0.4, priceUsd: 65000, changePct: 2.5 }),
    ]);
    expect(a.comingSoon).toBe(false);
    expect(a.changePct).toBe(2.5);
  });
});
