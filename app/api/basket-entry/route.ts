import { NextResponse } from "next/server";
import { getAddress, isAddress, type Address } from "viem";
import { listThemes } from "@/lib/baskets/registry";
import { buildSafeBasketContractCalls } from "@/lib/lifi/basketEntry";

export const dynamic = "force-dynamic";

/** Server-side: resolve Uniswap slippage floors (needs the API key) and return the LI.FI contract calls. */
export async function POST(req: Request) {
  let slug: string, amount: number, recipient: string, enterBasket: string;
  try {
    ({ slug, amount, recipient, enterBasket } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!slug || typeof amount !== "number" || amount <= 0 || !recipient || !enterBasket) {
    return NextResponse.json({ error: "slug, amount (positive number), recipient, enterBasket are required" }, { status: 400 });
  }
  if (!isAddress(recipient) || !isAddress(enterBasket)) {
    return NextResponse.json({ error: "recipient and enterBasket must be valid addresses" }, { status: 400 });
  }
  if (!listThemes().some((t) => t.slug === slug)) {
    return NextResponse.json({ error: `unknown theme: ${slug}` }, { status: 404 });
  }
  try {
    const totalUsdce = BigInt(Math.round(amount * 1e6));
    const contractCalls = await buildSafeBasketContractCalls(slug, totalUsdce, getAddress(recipient) as Address, getAddress(enterBasket) as Address);
    return NextResponse.json({ contractCalls });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
