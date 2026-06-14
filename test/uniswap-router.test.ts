import { describe, it, expect } from "vitest";
import { decodeFunctionData, getAddress } from "viem";
import { buildExactInputSingleData, SWAP_ROUTER_02_ABI } from "@/lib/uniswap/router";
import { ADDR } from "@/lib/addresses";

const RECIPIENT = getAddress("0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0");

describe("buildExactInputSingleData (Uniswap SwapRouter02)", () => {
  it("encodes exactInputSingle with USDC.e in, the token out, fee, recipient, amount and minOut", () => {
    const data = buildExactInputSingleData({
      tokenOut: ADDR.weth,
      fee: 500,
      amountIn: 3_000_000n, // 3 USDC.e
      minOut: 900_000_000_000_000n, // 0.0009 WETH floor
      recipient: RECIPIENT,
    });
    const { functionName, args } = decodeFunctionData({ abi: SWAP_ROUTER_02_ABI, data });
    expect(functionName).toBe("exactInputSingle");
    const p = args[0] as Record<string, unknown>;
    expect(p.tokenIn).toBe(ADDR.usdce);
    expect(p.tokenOut).toBe(ADDR.weth);
    expect(p.fee).toBe(500);
    expect(p.recipient).toBe(RECIPIENT);
    expect(p.amountIn).toBe(3_000_000n);
    expect(p.amountOutMinimum).toBe(900_000_000_000_000n);
    expect(p.sqrtPriceLimitX96).toBe(0n);
  });
});
