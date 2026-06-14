import { describe, it, expect } from "vitest";
import { decodeFunctionData, getAddress } from "viem";
import { buildBasketContractCalls, ENTER_PREDICTION_LEG_ABI, ENTER_ASSET_LEG_ABI } from "@/lib/lifi/basket";
import { getTheme } from "@/lib/baskets/registry";
import { ADDR } from "@/lib/addresses";

const RECIPIENT = getAddress("0x00000000000000000000000000000000000000bE");
const ENTER = getAddress("0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0");

describe("buildBasketContractCalls — index allocation across prediction legs + on-chain sleeve", () => {
  it("emits one call per leg (predictions + sleeve) and the amounts sum to the deposit exactly", () => {
    const total = 10_000_000n;
    const calls = buildBasketContractCalls("ai", total, RECIPIENT, ENTER);
    const legs = getTheme("ai").legs;
    expect(calls.length).toBe(legs.length); // 2 predictions + 2 sleeve = 4
    expect(calls.reduce((a, c) => a + BigInt(c.fromAmount), 0n)).toBe(total);
    for (const c of calls) {
      expect(c.fromTokenAddress).toBe(ADDR.usdce);
      expect(c.toContractAddress).toBe(ENTER);
    }
  });

  it("allocates by each leg's weight (AI: .35 .15 .30 .20 of 10 USDC.e)", () => {
    const calls = buildBasketContractCalls("ai", 10_000_000n, RECIPIENT, ENTER);
    expect(calls.map((c) => BigInt(c.fromAmount))).toEqual([3_500_000n, 1_500_000n, 3_000_000n, 2_000_000n]);
  });

  it("encodes enterPredictionLeg for prediction legs", () => {
    const calls = buildBasketContractCalls("ai", 8_000_000n, RECIPIENT, ENTER);
    const { functionName, args } = decodeFunctionData({ abi: ENTER_PREDICTION_LEG_ABI, data: calls[0].toContractCallData });
    expect(functionName).toBe("enterPredictionLeg");
    expect(args[3]).toBe(RECIPIENT);
  });

  it("encodes enterAssetLeg(amount, recipient, SwapRouter02, SwapRouter02, token, minOut, swapData) for sleeve legs", () => {
    const calls = buildBasketContractCalls("ai", 10_000_000n, RECIPIENT, ENTER, { minOut: () => 5n });
    const assetCall = calls[2]; // first asset leg (WETH)
    const { functionName, args } = decodeFunctionData({ abi: ENTER_ASSET_LEG_ABI, data: assetCall.toContractCallData });
    expect(functionName).toBe("enterAssetLeg");
    expect(args[0]).toBe(3_000_000n);          // amount
    expect(args[1]).toBe(RECIPIENT);           // recipient
    expect(args[2]).toBe(ADDR.swapRouter02);   // router
    expect(args[3]).toBe(ADDR.swapRouter02);   // spender
    expect(args[4]).toBe(ADDR.weth);           // assetOut
    expect(args[5]).toBe(5n);                  // minAmountOut
    expect(args[6]).not.toBe("0x");            // swapData present
  });

  it("throws on a theme with no prediction markets", () => {
    expect(() => buildBasketContractCalls("nope", 1n, RECIPIENT, ENTER)).toThrow();
  });
});
