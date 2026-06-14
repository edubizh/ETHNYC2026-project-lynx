import { describe, it, expect } from "vitest";
import { WINDOWS, composeIdx, aggregateMindshare, seedMindshareView, OTHERS_SECTORS } from "@/lib/mindshare";

describe("composeIdx (0–100 composite of band-percentile × belief odds)", () => {
  it("is the geometric mean of the two normalized signals, scaled to 0–100", () => {
    // sqrt(0.30 * 0.51) * 100 = 39.1
    expect(composeIdx(0.3, 0.51)).toBeCloseTo(39.1, 1);
    expect(composeIdx(1, 1)).toBeCloseTo(100, 6);
  });

  it("clamps both inputs into [0,1]", () => {
    expect(composeIdx(2, 0.5)).toBeCloseTo(70.7, 1); // a clamps to 1 -> sqrt(0.5)*100
    expect(composeIdx(-1, 0.9)).toBe(0); // a clamps to 0 -> 0
  });
});

describe("aggregateMindshare (tile sizes ∝ real activity, Others fills the remainder)", () => {
  const buckets = [
    { slug: "ai", title: "AI", activity: 50, idx: 72, change: 3.1 },
    { slug: "crypto", title: "Crypto", activity: 30, idx: 64, change: -1.2 },
    { slug: "macro", title: "Macro & Fed", activity: 20, idx: 41, change: 0.4 },
  ];

  it("ranks buckets desc by activity-weighted mindshare and passes idx/change through", () => {
    const v = aggregateMindshare(buckets);
    expect(v.ranked.map((r) => r.slug)).toEqual(["ai", "crypto", "macro"]);
    expect(v.ranked[0].ms.idx).toBe(72);
    expect(v.ranked[1].ms.change).toBe(-1.2);
    // shares preserve activity proportions: ai = 50/30 × crypto
    expect(v.ranked[0].ms.mindshare / v.ranked[1].ms.mindshare).toBeCloseTo(50 / 30, 2);
  });

  it("buckets + Others sum to ~100 and Others reserves a positive coming-soon slice", () => {
    const v = aggregateMindshare(buckets);
    const sum = v.ranked.reduce((s, r) => s + r.ms.mindshare, 0) + v.others.mindshare;
    expect(sum).toBeCloseTo(100, 1);
    expect(v.others.mindshare).toBeGreaterThan(0);
    expect(v.others.sectors).toBe(OTHERS_SECTORS);
  });

  it("degrades safely when total activity is zero (no divide-by-zero)", () => {
    const v = aggregateMindshare(buckets.map((b) => ({ ...b, activity: 0 })));
    expect(v.ranked.every((r) => r.ms.mindshare === 0)).toBe(true);
    expect(v.others.mindshare).toBeCloseTo(100, 1);
  });
});

describe("seedMindshareView (verified-seed fallback)", () => {
  it("returns the 7 buckets ranked with AI flagship + a positive Others slice", () => {
    const v = seedMindshareView();
    expect(v.ranked.length).toBe(7);
    expect(v.ranked[0].slug).toBe("ai");
    expect(v.others.mindshare).toBeGreaterThan(0);
  });
});

describe("WINDOWS", () => {
  it("exposes the four treemap timeframes in display order", () => {
    expect(WINDOWS).toEqual(["24h", "7d", "30d", "3m"]);
  });
});
