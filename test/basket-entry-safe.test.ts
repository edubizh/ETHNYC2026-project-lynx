import { describe, it, expect, vi, afterEach } from "vitest";
import { decodeFunctionData, getAddress } from "viem";
import * as us from "@/lib/adapters/uniswap";
import { buildSafeBasketContractCalls } from "@/lib/lifi/basketEntry";
import { ENTER_ASSET_LEG_ABI } from "@/lib/lifi/basket";

afterEach(() => vi.restoreAllMocks());

const RECIPIENT = getAddress("0x00000000000000000000000000000000000000bE");
const ENTER = getAddress("0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0");

describe("buildSafeBasketContractCalls", () => {
  it("resolves real Uniswap /quote slippage floors so asset legs ship a non-zero minAmountOut", async () => {
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(4000); // every token priced
    const calls = await buildSafeBasketContractCalls("ai", 10_000_000n, RECIPIENT, ENTER, 0.01);
    const assetCalls = calls.filter((c) => c.toContractGasLimit === "700000"); // asset legs
    expect(assetCalls.length).toBeGreaterThan(0);
    for (const c of assetCalls) {
      const { args } = decodeFunctionData({ abi: ENTER_ASSET_LEG_ABI, data: c.toContractCallData });
      expect(args[5] as bigint).toBeGreaterThan(0n); // minAmountOut > 0 — protected swap
    }
  });

  it("THROWS rather than ship an unprotected swap when an asset leg can't be priced (/quote down)", async () => {
    vi.spyOn(us, "fetchAssetPrice").mockRejectedValue(new Error("quote down"));
    await expect(buildSafeBasketContractCalls("ai", 10_000_000n, RECIPIENT, ENTER, 0.01)).rejects.toThrow(/price/i);
  });
});
