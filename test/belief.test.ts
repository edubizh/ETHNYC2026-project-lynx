import { describe, it, expect } from "vitest";
import { computeBelief, type BeliefInput } from "@/lib/belief/engine";

const mk = (over: Partial<BeliefInput>): BeliefInput => ({
  id: "m",
  venue: "polymarket",
  prob: 0.5,
  polarity: 1,
  relevance: 1,
  volume: 10_000,
  ...over,
});
const width = (b: { low: number; high: number }) => b.high - b.low;

describe("computeBelief — Theme Conviction Index", () => {
  it("orients each market by polarity (YES bearish → 1 − prob)", () => {
    expect(computeBelief([mk({ prob: 0.8, polarity: -1 })]).center).toBeCloseTo(0.2, 6);
  });

  it("is a weighted mean of oriented probs (equal weights → simple mean), bounded in [0,1]", () => {
    const b = computeBelief([mk({ id: "a", prob: 0.4 }), mk({ id: "b", prob: 0.6 })]);
    expect(b.center).toBeCloseTo(0.5, 6);
    expect(b.low).toBeLessThan(b.center);
    expect(b.high).toBeGreaterThan(b.center);
    expect(b.low).toBeGreaterThanOrEqual(0);
    expect(b.high).toBeLessThanOrEqual(1);
  });

  it("weights by liquidity — the deeper market pulls the center toward its prob", () => {
    const b = computeBelief([mk({ id: "a", prob: 0.2, volume: 1_000 }), mk({ id: "b", prob: 0.8, volume: 1_000_000 })]);
    expect(b.center).toBeGreaterThan(0.6);
  });

  it("range WIDENS when markets disagree", () => {
    const agree = computeBelief([mk({ id: "a", prob: 0.45 }), mk({ id: "b", prob: 0.55 })]);
    const disagree = computeBelief([mk({ id: "a", prob: 0.2 }), mk({ id: "b", prob: 0.8 })]);
    expect(width(disagree)).toBeGreaterThan(width(agree));
  });

  it("range TIGHTENS with more liquidity (same disagreement)", () => {
    const thin = computeBelief([mk({ id: "a", prob: 0.4, volume: 500 }), mk({ id: "b", prob: 0.6, volume: 500 })]);
    const deep = computeBelief([mk({ id: "a", prob: 0.4, volume: 2_000_000 }), mk({ id: "b", prob: 0.6, volume: 2_000_000 })]);
    expect(width(deep)).toBeLessThan(width(thin));
  });

  it("range is WIDER near 50/50 than near an extreme (intrinsic uncertainty)", () => {
    expect(width(computeBelief([mk({ prob: 0.5 })]))).toBeGreaterThan(width(computeBelief([mk({ prob: 0.05 })])));
  });

  it("drops zero-relevance and invalid inputs", () => {
    const b = computeBelief([mk({ id: "keep", prob: 0.3 }), mk({ id: "drop", prob: 0.9, relevance: 0 })]);
    expect(b.center).toBeCloseTo(0.3, 6);
    expect(b.breakdown.map((x) => x.id)).toEqual(["keep"]);
  });

  it("breakdown weights are normalized shares that sum to 1", () => {
    const b = computeBelief([mk({ id: "a", prob: 0.3, volume: 1_000 }), mk({ id: "b", prob: 0.7, volume: 50_000 })]);
    expect(b.breakdown.reduce((s, x) => s + x.weight, 0)).toBeCloseTo(1, 6);
  });

  it("returns a neutral wide range when there are no usable inputs", () => {
    const b = computeBelief([]);
    expect(b.center).toBe(0.5);
    expect(b.low).toBe(0);
    expect(b.high).toBe(1);
    expect(b.confidence).toBe(0);
  });

  it("keeps 0 ≤ low ≤ center ≤ high ≤ 1 even at extremes", () => {
    const b = computeBelief([mk({ prob: 0.99, volume: 10 })]);
    expect(b.low).toBeGreaterThanOrEqual(0);
    expect(b.low).toBeLessThanOrEqual(b.center);
    expect(b.center).toBeLessThanOrEqual(b.high);
    expect(b.high).toBeLessThanOrEqual(1);
  });
});
