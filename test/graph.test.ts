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
  it("includes only assetClass'd securities, ordered securities-first by class", () => {
    const out = selectOnChainAssets([
      sec({ ticker: "WETH", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", assetClass: "major", priceUsd: 4300 }),
      sec({ ticker: "NVDA", chain: "solana/CEX", liquidity: "low", assetClass: "tokenized-equity", band: { low: 1, high: 2 }, bandPercentile: 0.5, priceUsd: 1.5 }),
      sec({ ticker: "UNI", chain: "polygon", liquidity: "high", assetClass: "defi" }),
      sec({ ticker: "PAXG", chain: "ethereum", liquidity: "medium", assetClass: "rwa" }),
      sec({ ticker: "TRUMP", chain: "solana", liquidity: "high", assetClass: "memecoin" }),
      sec({ ticker: "TLT", chain: "off-rail", band: { low: 1, high: 2 }, bandPercentile: 0.5, priceUsd: 1.5 }), // off-rail equity -> excluded
    ]);
    expect(out.map((a) => a.ticker)).toEqual(["NVDA", "PAXG", "UNI", "WETH", "TRUMP"]);
    expect(out[0]).toMatchObject({ ticker: "NVDA", assetClass: "tokenized-equity", buyable: false });
  });

  it("orders buyable then tier within a class", () => {
    const out = selectOnChainAssets([
      sec({ ticker: "LINK", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "medium", assetClass: "major" }),
      sec({ ticker: "WETH", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", assetClass: "major" }),
      sec({ ticker: "wstETH", chain: "polygon", liquidity: "low", assetClass: "major" }),
    ]);
    expect(out.map((a) => a.ticker)).toEqual(["WETH", "LINK", "wstETH"]); // buyable high, buyable medium, then coming-soon low
  });

  it("excludes off-rail equities and a tokenized stock appears in BOTH chart and list", () => {
    const nvda = sec({ ticker: "NVDA", chain: "solana/CEX", liquidity: "low", assetClass: "tokenized-equity", band: { low: 1, high: 2 }, bandPercentile: 0.5, priceUsd: 1.5 });
    const tlt = sec({ ticker: "TLT", chain: "off-rail", band: { low: 1, high: 2 }, bandPercentile: 0.5, priceUsd: 1.5 });
    expect(selectOnChainAssets([nvda, tlt]).map((a) => a.ticker)).toEqual(["NVDA"]); // TLT excluded (no assetClass)
    expect(selectGraphAssets([nvda, tlt]).map((a) => a.ticker)).toEqual(["NVDA", "TLT"]); // both banded -> chart
  });
});
