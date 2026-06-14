import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchKalshiOdds } from "@/lib/adapters/kalshi";

afterEach(() => vi.restoreAllMocks());

const market = (over: Record<string, unknown>) =>
  ({ ok: true, json: async () => ({ market: { status: "active", ...over } }) }) as unknown;

describe("kalshi odds adapter", () => {
  it("derives YES probability from the bid/ask mid (cents) + volume + open interest", async () => {
    global.fetch = vi.fn().mockResolvedValue(market({ yes_bid: 70, yes_ask: 74, volume: 1200, open_interest: 540 })) as never;
    const o = await fetchKalshiOdds("KXBTC-26");
    expect(o.prob).toBeCloseTo(0.72, 6); // (70+74)/2/100
    expect(o.volume).toBe(1200);
    expect(o.openInterest).toBe(540);
  });

  it("accepts dollar-denominated prices (0.xx) too", async () => {
    global.fetch = vi.fn().mockResolvedValue(market({ yes_bid_dollars: "0.40", yes_ask_dollars: "0.44", volume: 10 })) as never;
    expect((await fetchKalshiOdds("X")).prob).toBeCloseTo(0.42, 6);
  });

  it("falls back to last_price when there is no book", async () => {
    global.fetch = vi.fn().mockResolvedValue(market({ yes_bid: 0, yes_ask: 0, last_price: 33, volume: 5 })) as never;
    expect((await fetchKalshiOdds("X")).prob).toBeCloseTo(0.33, 6);
  });

  it("throws on a settled/closed market (so a finalized 0/100 can't poison the belief score)", async () => {
    global.fetch = vi.fn().mockResolvedValue(market({ status: "settled", last_price: 100 })) as never;
    await expect(fetchKalshiOdds("X")).rejects.toThrow(/settled/);
  });

  it("throws on a non-OK response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 }) as never;
    await expect(fetchKalshiOdds("X")).rejects.toThrow(/Kalshi 429/);
  });

  it("throws when no valid YES price is present", async () => {
    global.fetch = vi.fn().mockResolvedValue(market({ yes_bid: 0, yes_ask: 0, last_price: 0, volume: 1 })) as never;
    await expect(fetchKalshiOdds("X")).rejects.toThrow(/no valid YES price/);
  });
});
