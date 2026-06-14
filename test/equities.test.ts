import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchEquityPrice, fetchEquityQuote } from "@/lib/adapters/equities";

afterEach(() => vi.restoreAllMocks());

describe("equities quote (price + daily %change)", () => {
  it("parses current price and daily percent change (Finnhub c + dp)", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ c: 165.42, d: 1, dp: 0.63 }) }) as any;
    const q = await fetchEquityQuote("NVDA");
    expect(q.price).toBeCloseTo(165.42, 2);
    expect(q.changePct).toBeCloseTo(0.63, 2);
  });

  it("defaults changePct to 0 when dp is absent or non-numeric", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ c: 10 }) }) as any;
    expect((await fetchEquityQuote("NVDA")).changePct).toBe(0);
  });

  it("throws when there is no current price", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ c: 0, dp: 1 }) }) as any;
    await expect(fetchEquityQuote("NVDA")).rejects.toThrow(/no current price/);
  });
});

describe("equities adapter (display-only)", () => {
  it("parses the current price from a Finnhub-style quote", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ c: 165.42, d: 1, dp: 0.6 }) }) as any;
    expect(await fetchEquityPrice("NVDA")).toBeCloseTo(165.42, 2);
  });

  it("throws when there is no current price", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ c: 0 }) }) as any;
    await expect(fetchEquityPrice("NVDA")).rejects.toThrow(/no current price/);
  });

  it("throws on a non-OK response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 }) as any;
    await expect(fetchEquityPrice("NVDA")).rejects.toThrow(/Equities 429/);
  });
});
