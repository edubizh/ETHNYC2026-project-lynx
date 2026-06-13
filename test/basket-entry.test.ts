import { describe, it, expect } from "vitest";
import { decodeFunctionData, getAddress } from "viem";
import { buildBasketContractCalls, ENTER_PREDICTION_LEG_ABI } from "@/lib/lifi/basket";
import { getTheme } from "@/lib/baskets/registry";
import { ADDR } from "@/lib/addresses";

const RECIPIENT = getAddress("0x00000000000000000000000000000000000000bE");
const ENTER = getAddress("0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0");

describe("buildBasketContractCalls — index allocation across markets (NOT a parlay)", () => {
  it("emits one weighted call per prediction market and the amounts sum to the deposit exactly", () => {
    const total = 10_000_000n; // 10 USDC.e (6dp)
    const calls = buildBasketContractCalls("us-politics", total, RECIPIENT, ENTER);
    const preds = getTheme("us-politics").legs.filter((l) => l.kind === "prediction");
    expect(calls.length).toBe(preds.length); // one contractCall per market, not a single combined bet
    const sum = calls.reduce((a, c) => a + BigInt(c.fromAmount), 0n);
    expect(sum).toBe(total); // no capital lost to rounding — the deposit is fully allocated
    for (const c of calls) {
      expect(c.fromTokenAddress).toBe(ADDR.usdce);
      expect(c.toContractAddress).toBe(ENTER);
    }
  });

  it("allocates proportionally to the strategy weights (re-normalized among the prediction legs)", () => {
    // AI: prediction legs weight 0.35 / 0.15 -> 70% / 30% of the prediction allocation.
    const total = 10_000_000n;
    const calls = buildBasketContractCalls("ai", total, RECIPIENT, ENTER);
    expect(calls.length).toBe(2);
    expect(BigInt(calls[0].fromAmount)).toBe(7_000_000n);
    expect(BigInt(calls[1].fromAmount)).toBe(3_000_000n);
  });

  it("encodes enterPredictionLeg(conditionId, questionId, amount, recipient) for each market", () => {
    const total = 8_000_000n;
    const calls = buildBasketContractCalls("ai", total, RECIPIENT, ENTER);
    const preds = getTheme("ai").legs.filter((l) => l.kind === "prediction") as Array<{
      conditionId: `0x${string}`;
      questionId: `0x${string}`;
    }>;
    calls.forEach((c, i) => {
      const { functionName, args } = decodeFunctionData({ abi: ENTER_PREDICTION_LEG_ABI, data: c.toContractCallData });
      expect(functionName).toBe("enterPredictionLeg");
      expect(args[0]).toBe(preds[i].conditionId);
      expect(args[1]).toBe(preds[i].questionId);
      expect(args[2]).toBe(BigInt(c.fromAmount));
      expect(args[3]).toBe(RECIPIENT);
    });
  });

  it("throws on a theme with no prediction markets", () => {
    expect(() => buildBasketContractCalls("nope", 1n, RECIPIENT, ENTER)).toThrow();
  });
});
