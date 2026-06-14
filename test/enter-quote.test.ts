import { describe, it, expect, vi, beforeEach } from "vitest";

const { quoteMock } = vi.hoisted(() => ({ quoteMock: vi.fn() }));
vi.mock("@lifi/sdk", () => ({
  getContractCallsQuote: quoteMock,
  createConfig: vi.fn(),
  EVM: vi.fn(),
  convertQuoteToRoute: vi.fn(),
  executeRoute: vi.fn(),
}));

import { buildEnterQuote } from "@/lib/lifi/enter";
import { ADDR } from "@/lib/addresses";

beforeEach(() => quoteMock.mockReset().mockResolvedValue({}));

describe("buildEnterQuote", () => {
  it("builds a SAME-CHAIN Polygon (137->137) contract-calls request", async () => {
    await buildEnterQuote({
      fromChainId: 137,
      fromToken: ADDR.usdcNative,
      fromAddress: "0x00000000000000000000000000000000000000bE",
      fromAmount: "10000000",
      contractCalls: [],
    });
    const req = quoteMock.mock.calls[0][0];
    expect(req.fromChain).toBe(137);
    expect(req.toChain).toBe(137);
    // Same-chain delivers USDC.e — the token every EnterBasket contractCall consumes.
    expect(req.toToken).toBe(ADDR.usdce);
  });

  it("still supports the cross-chain Base (8453) source", async () => {
    await buildEnterQuote({
      fromChainId: 8453,
      fromToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      fromAddress: "0x00000000000000000000000000000000000000bE",
      fromAmount: "10000000",
      contractCalls: [],
    });
    const req = quoteMock.mock.calls[0][0];
    expect(req.fromChain).toBe(8453);
    // Cross-chain (unverified stretch) is left on native USDC — unchanged.
    expect(req.toToken).toBe(ADDR.usdcNative);
  });
});
