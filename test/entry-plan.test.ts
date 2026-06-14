import { describe, it, expect } from "vitest";
import { planEntry, type EntryPlan } from "@/lib/lifi/entryPlan";
import { ADDR } from "@/lib/addresses";

describe("planEntry", () => {
  it("Polygon (137) → same-chain plan: 2 steps, native USDC, no Bridge", () => {
    const p = planEntry(137) as EntryPlan;
    expect(p.mode).toBe("same-chain");
    expect(p.fromChainId).toBe(137);
    expect(p.fromToken).toBe(ADDR.usdcNative);
    expect(p.steps).toHaveLength(2);
    expect(p.steps.join(" ").toLowerCase()).not.toContain("bridge");
  });

  it("Ethereum/Base are unsupported unless the cross-chain flag is on", () => {
    expect(planEntry(1)).toEqual({ supported: false });
    expect(planEntry(8453)).toEqual({ supported: false });
  });

  it("with crossChain:true, Base (8453) → cross-chain plan: 3 steps incl. Bridge", () => {
    const p = planEntry(8453, { crossChain: true }) as EntryPlan;
    expect(p.mode).toBe("cross-chain");
    expect(p.fromChainId).toBe(8453);
    expect(p.fromToken).toBe("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
    expect(p.steps).toHaveLength(3);
    expect(p.steps.join(" ").toLowerCase()).toContain("bridge");
  });

  it("with crossChain:true, Ethereum (1) uses the mainnet USDC source token", () => {
    const p = planEntry(1, { crossChain: true }) as EntryPlan;
    expect(p.fromToken).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  });

  it("unknown / undefined chain → unsupported (even with the flag on)", () => {
    expect(planEntry(42161, { crossChain: true })).toEqual({ supported: false });
    expect(planEntry(undefined, { crossChain: true })).toEqual({ supported: false });
  });
});
