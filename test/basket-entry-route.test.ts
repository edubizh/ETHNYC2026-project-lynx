import { describe, it, expect, vi, afterEach } from "vitest";

// Mock the server-only builder so the route test needs no Uniswap key / network.
vi.mock("@/lib/lifi/basketEntry", () => ({
  buildSafeBasketContractCalls: vi.fn(),
}));

import { POST } from "@/app/api/basket-entry/route";
import { buildSafeBasketContractCalls } from "@/lib/lifi/basketEntry";

afterEach(() => vi.restoreAllMocks());

const ENTER = "0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0";
const RECIP = "0x00000000000000000000000000000000000000Be"; // EIP-55 checksummed (viem isAddress is strict)
const req = (body: unknown) => new Request("http://localhost/api/basket-entry", { method: "POST", body: JSON.stringify(body) });

describe("POST /api/basket-entry", () => {
  it("400 on a non-positive amount", async () => {
    const res = await POST(req({ slug: "ai", amount: 0, recipient: RECIP, enterBasket: ENTER }));
    expect(res.status).toBe(400);
  });

  it("400 on a malformed JSON body", async () => {
    const res = await POST(new Request("http://localhost/api/basket-entry", { method: "POST", body: "{ not json" }));
    expect(res.status).toBe(400);
  });

  it("400 on a missing required field (no slug)", async () => {
    const res = await POST(req({ amount: 5, recipient: RECIP, enterBasket: ENTER }));
    expect(res.status).toBe(400);
  });

  it("400 on a non-address recipient", async () => {
    const res = await POST(req({ slug: "ai", amount: 5, recipient: "nope", enterBasket: ENTER }));
    expect(res.status).toBe(400);
  });

  it("404 on an unknown theme", async () => {
    const res = await POST(req({ slug: "does-not-exist", amount: 5, recipient: RECIP, enterBasket: ENTER }));
    expect(res.status).toBe(404);
  });

  it("502 when the builder throws (e.g. /quote down → refuses unprotected swap)", async () => {
    vi.mocked(buildSafeBasketContractCalls).mockRejectedValue(new Error("No Uniswap price for WETH"));
    const res = await POST(req({ slug: "ai", amount: 5, recipient: RECIP, enterBasket: ENTER }));
    expect(res.status).toBe(502);
  });

  it("200 with contractCalls on the happy path", async () => {
    vi.mocked(buildSafeBasketContractCalls).mockResolvedValue([{ fromAmount: "1" } as any]);
    const res = await POST(req({ slug: "ai", amount: 5, recipient: RECIP, enterBasket: ENTER }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.contractCalls)).toBe(true);
  });
});
