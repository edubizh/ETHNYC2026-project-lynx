import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchBeliefProb, fetchMarketVolumes } from "@/lib/adapters/polymarket";
import { fetchAssetPrice } from "@/lib/adapters/uniswap";

afterEach(() => vi.restoreAllMocks());

describe("Polymarket Gamma volume adapter", () => {
  it("maps the four window volume fields (24h/7d/30d/3m) from one Gamma fetch", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ volume24hr: 549.19, volume1wk: 23141.1, volume1mo: 54259.58, volumeNum: 359174.78 }),
    }) as any;
    const v = await fetchMarketVolumes("608368");
    expect(v["24h"]).toBeCloseTo(549.19, 2);
    expect(v["7d"]).toBeCloseTo(23141.1, 1);
    expect(v["30d"]).toBeCloseTo(54259.58, 2);
    expect(v["3m"]).toBeCloseTo(359174.78, 2); // 3M -> volumeNum (Gamma has no 90-day bucket)
  });

  it("treats missing/non-numeric volume fields as zero", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ volume24hr: 100 }) }) as any;
    const v = await fetchMarketVolumes("608368");
    expect(v["24h"]).toBe(100);
    expect(v["7d"]).toBe(0);
    expect(v["3m"]).toBe(0);
  });

  it("throws on a non-OK Gamma response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 }) as any;
    await expect(fetchMarketVolumes("608368")).rejects.toThrow(/Gamma 502/);
  });
});

describe("Polymarket Gamma adapter", () => {
  it("parses YES odds (outcomePrices is a STRINGIFIED JSON array)", async () => {
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
});

describe("Uniswap /quote price oracle", () => {
  it("parses the USD price from the VERIFIED nested shape (quote.output.amount + quote.swapper)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        routing: "CLASSIC",
        quote: { output: { amount: "58000000", token: "0xUSDC" }, swapper: "0x0000000000000000000000000000000000000001" },
        permitData: null,
      }),
    }) as any;
    expect(await fetchAssetPrice("0xToken")).toBeCloseTo(58, 6); // 58000000 / 1e6 -> 58 USDC
  });

  it("tolerates a flat { quote: string, swapper } response shape", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ quote: "58000000", swapper: "0x0000000000000000000000000000000000000001" }),
    }) as any;
    expect(await fetchAssetPrice("0xToken")).toBeCloseTo(58, 6);
  });

  it("rejects a /quote missing the swapper field", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ quote: { output: { amount: "58000000" } } }),
    }) as any;
    await expect(fetchAssetPrice("0xToken")).rejects.toThrow(/missing `swapper`/);
  });

  it("rejects a /quote missing the output amount", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ quote: { swapper: "0x0000000000000000000000000000000000000001" } }),
    }) as any;
    await expect(fetchAssetPrice("0xToken")).rejects.toThrow(/missing output amount/);
  });

  it("sizes the /quote input to ONE unit of the token by its decimals (defaults to 18)", async () => {
    const bodies: Array<{ amount: string }> = [];
    global.fetch = vi.fn().mockImplementation((_url: string, init: { body: string }) => {
      bodies.push(JSON.parse(init.body));
      return Promise.resolve({
        ok: true,
        json: async () => ({ quote: "64000000", swapper: "0x0000000000000000000000000000000000000001" }),
      });
    }) as any;
    await fetchAssetPrice("0xWBTC", { decimals: 8 });
    await fetchAssetPrice("0xWETH");
    expect(bodies[0].amount).toBe("100000000"); // 1e8 = one WBTC (8dp), NOT 1e18 (would quote ~10B WBTC)
    expect(bodies[1].amount).toBe("1000000000000000000"); // default 18dp = one unit
  });
});
