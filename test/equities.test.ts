import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchEquityPrice } from "@/lib/adapters/equities";

afterEach(() => vi.restoreAllMocks());

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
