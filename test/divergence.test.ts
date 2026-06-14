import { describe, it, expect } from "vitest";
import { assetBandPercentile, divergence, gapVsRange } from "@/lib/divergence/engine";

describe("divergence engine", () => {
  it("maps an asset price to its percentile within a published analyst band [low, high]", () => {
    expect(assetBandPercentile(100, 50, 150)).toBeCloseTo(0.5, 6);
    expect(assetBandPercentile(150, 50, 150)).toBeCloseTo(1, 6);
    expect(assetBandPercentile(25, 50, 150)).toBeCloseTo(0, 6); // clamped low
    expect(assetBandPercentile(200, 50, 150)).toBeCloseTo(1, 6); // clamped high
  });

  it("rejects a degenerate band", () => {
    expect(() => assetBandPercentile(100, 150, 50)).toThrow(/high must exceed low/);
  });

  it("computes the signed AI Sentiment Gap = belief - assetBandPercentile, in percentage points", () => {
    const d = divergence(0.72, 0.58);
    expect(d.gapPct).toBeCloseTo(14, 6);
    expect(d.direction).toBe("belief-higher");
  });

  it("labels the direction when the asset band percentile leads", () => {
    const d = divergence(0.3, 0.6);
    expect(d.gapPct).toBeCloseTo(30, 6);
    expect(d.direction).toBe("asset-higher");
  });

  it("labels near-equal sentiment as aligned", () => {
    expect(divergence(0.5, 0.495).direction).toBe("aligned");
  });
});

describe("gapVsRange (belief RANGE vs asset percentile)", () => {
  it("is aligned (gap 0) when the asset percentile sits inside the belief range", () => {
    const g = gapVsRange(0.4, 0.6, 0.5);
    expect(g.gapPct).toBe(0);
    expect(g.direction).toBe("aligned");
  });

  it("measures distance to the UPPER edge when the asset is above the belief range (asset-higher)", () => {
    const g = gapVsRange(0.4, 0.6, 0.8);
    expect(g.gapPct).toBeCloseTo(20, 6); // (0.8 - 0.6) * 100
    expect(g.direction).toBe("asset-higher");
  });

  it("measures distance to the LOWER edge when the asset is below the belief range (belief-higher)", () => {
    const g = gapVsRange(0.4, 0.6, 0.1);
    expect(g.gapPct).toBeCloseTo(30, 6); // (0.4 - 0.1) * 100
    expect(g.direction).toBe("belief-higher");
  });
});
