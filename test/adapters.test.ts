import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchBeliefProb } from "@/lib/adapters/polymarket";
import { fetchAssetPrice } from "@/lib/adapters/uniswap";

afterEach(() => vi.restoreAllMocks());

describe("adapters", () => {
  it("parses YES odds from a Gamma market (outcomePrices is a STRINGIFIED JSON array)", async () => {
    // Real Gamma shape: outcomes + outcomePrices are BOTH JSON-encoded strings, not arrays.
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ outcomes: '["Yes","No"]', outcomePrices: '["0.51","0.49"]' }),
    }) as any;
    expect(await fetchBeliefProb("608368")).toBeCloseTo(0.51, 6);
  });

  it("selects the YES index even when outcomes are reordered", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ outcomes: '["No","Yes"]', outcomePrices: '["0.105","0.895"]' }),
    }) as any;
    expect(await fetchBeliefProb("631121")).toBeCloseTo(0.895, 6);
  });

  it("throws on a non-OK Gamma response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 }) as any;
    await expect(fetchBeliefProb("608368")).rejects.toThrow(/Gamma 503/);
  });

  it("parses a USD price from a Uniswap /quote response (q.quote is a STRING amount; needs a swapper)", async () => {
    // Real shape: q.quote is a decimal-string token amount (USDC, 6dp); response carries a `swapper`.
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ quote: "58000000", swapper: "0x0000000000000000000000000000000000000001" }),
    }) as any;
    expect(await fetchAssetPrice("0xToken")).toBeCloseTo(58, 6); // 58000000 / 1e6 -> 58 USDC
  });

  it("rejects a Uniswap /quote missing the swapper field", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ quote: "58000000" }),
    }) as any;
    await expect(fetchAssetPrice("0xToken")).rejects.toThrow(/missing `swapper`/);
  });
});
