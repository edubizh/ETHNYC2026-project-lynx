import { describe, it, expect, vi, afterEach } from "vitest";
import * as us from "@/lib/adapters/uniswap";
import { resolveAssetMinOut } from "@/lib/lifi/assetQuotes";
import type { AssetLeg } from "@/lib/baskets/types";

afterEach(() => vi.restoreAllMocks());

const weth: AssetLeg = { kind: "asset", label: "x", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", ticker: "WETH", swapFee: 500, weight: 0.3 };

describe("resolveAssetMinOut", () => {
  it("converts a USDC.e amount to a slippage-floored token-out using the Uniswap /quote price", async () => {
    // 1 WETH = 4000 USDC -> 3 USDC.e buys 0.00075 WETH; 1% slippage floor = 0.0007425 WETH.
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4000);
    const minOut = await resolveAssetMinOut(weth, 3_000_000n, 0.01);
    // 3/4000 = 0.00075 ETH = 7.5e14 wei; *0.99 = 7.425e14
    expect(minOut).toBe(742_500_000_000_000n);
  });

  it("returns 0n if the quote feed is down (entry still proceeds; the contract slippage check is the backstop)", async () => {
    vi.spyOn(us, "fetchAssetPrice").mockRejectedValue(new Error("no key"));
    expect(await resolveAssetMinOut(weth, 3_000_000n, 0.01)).toBe(0n);
  });
});

const wbtc: AssetLeg = { kind: "asset", label: "x", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", ticker: "WBTC", swapFee: 500, weight: 0.4, decimals: 8 };

describe("resolveAssetMinOut — WBTC 8dp", () => {
  it("scales the floor by the token's decimals (8dp), not 18", async () => {
    // 1 WBTC = 64000 USDC -> 64 USDC.e buys 0.001 WBTC; 1% floor = 0.00099 WBTC = 99000 sats (8dp).
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(64000);
    const minOut = await resolveAssetMinOut(wbtc, 64_000_000n, 0.01);
    expect(minOut).toBe(99_000n); // 0.00099 * 1e8
  });
});
