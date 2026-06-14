import { describe, it, expect } from "vitest";
import { selectGraphAssets, selectOnChainAssets } from "@/lib/dashboard/graph";
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

  it("orders buyable tokens by liquidity tier (deep first)", () => {
    const out = selectOnChainAssets([
      sec({ ticker: "LINK", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "medium" }),
      sec({ ticker: "WETH", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high" }),
    ]);
    expect(out.map((a) => a.buyable)).toEqual([true, true]);
    expect(out.map((a) => a.ticker)).toEqual(["WETH", "LINK"]);
  });

  it("partitions cleanly against selectGraphAssets (no overlap)", () => {
    const secs = [
      sec({ ticker: "NVDA", band: { low: 1, high: 2 }, bandPercentile: 0.5, priceUsd: 1.5 }),
      sec({ ticker: "FET", chain: "ethereum", liquidity: "high" }),
    ];
    // Note: the selectors partition purely by liquidity (here) vs analystBand (graph). A security with
    // BOTH would appear in both; the registry invariant in Task 3 forbids that (except the crypto headline),
    // so in practice the partition is clean.
    expect(selectOnChainAssets(secs).map((a) => a.ticker)).toEqual(["FET"]);
    expect(selectGraphAssets(secs).map((a) => a.ticker)).toEqual(["NVDA"]);
  });
});
