import { NextResponse } from "next/server";
import type { Address } from "viem";
import { buildSafeBasketContractCalls } from "@/lib/lifi/basketEntry";

export const dynamic = "force-dynamic";

/** Server-side: resolve Uniswap slippage floors (needs the API key) and return the LI.FI contract calls. */
export async function POST(req: Request) {
  try {
    const { slug, amount, recipient, enterBasket } = await req.json();
    if (!slug || typeof amount !== "number" || !recipient || !enterBasket) {
      return NextResponse.json({ error: "slug, amount (number), recipient, enterBasket are required" }, { status: 400 });
    }
    const totalUsdce = BigInt(Math.round(amount * 1e6));
    const contractCalls = await buildSafeBasketContractCalls(slug, totalUsdce, recipient as Address, enterBasket as Address);
    return NextResponse.json({ contractCalls });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
