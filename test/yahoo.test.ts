import { describe, it, expect, vi, afterEach } from "vitest";

// v3 default export is a class to `new`; mock it so instances expose our spy as `quoteSummary`.
const { qs } = vi.hoisted(() => ({ qs: vi.fn() }));
vi.mock("yahoo-finance2", () => ({ default: class { quoteSummary = qs; } }));

import { fetchAnalystBand } from "@/lib/adapters/yahoo";

afterEach(() => qs.mockReset());

describe("yahoo analyst band (live, free)", () => {
  it("parses low / high / mean from financialData targets", async () => {
    qs.mockResolvedValue({ financialData: { targetLowPrice: 105, targetHighPrice: 305, targetMeanPrice: 210 } });
    const band = await fetchAnalystBand("NVDA");
    expect(band.low).toBe(105);
    expect(band.high).toBe(305);
    expect(band.mean).toBe(210);
  });

  it("omits mean when Yahoo doesn't return it", async () => {
    qs.mockResolvedValue({ financialData: { targetLowPrice: 80, targetHighPrice: 120 } });
    const band = await fetchAnalystBand("DJT");
    expect(band).toEqual({ low: 80, high: 120, mean: undefined });
  });

  it("throws when targets are missing (e.g. ETFs/crypto -> caller falls back to seed band)", async () => {
    qs.mockResolvedValue({ financialData: {} });
    await expect(fetchAnalystBand("TLT")).rejects.toThrow(/no valid analyst band/);
  });

  it("throws when high <= low", async () => {
    qs.mockResolvedValue({ financialData: { targetLowPrice: 300, targetHighPrice: 100 } });
    await expect(fetchAnalystBand("NVDA")).rejects.toThrow(/no valid analyst band/);
  });
});
