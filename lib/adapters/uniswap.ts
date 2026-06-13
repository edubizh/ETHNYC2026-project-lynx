import { config } from "@/lib/config";

// A read-only price quote still requires a `swapper` in the request; this placeholder is never executed.
const ORACLE_SWAPPER = "0x000000000000000000000000000000000000dEaD";
const TIMEOUT_MS = 6000;

/** Price of 1 unit of `token` in USDC via the Uniswap Trading API /quote (oracle, NOT the prize swap).
 *  VERIFIED shape (2026-06-13): the response is `{ routing, quote, permitData }` where `quote` is an
 *  OBJECT — the output amount is `quote.output.amount` (string, USDC 6dp) and the swapper is nested at
 *  `quote.swapper`. We stay tolerant of a flat `{ quote: "<amount>", swapper }` shape as a fallback. */
export async function fetchAssetPrice(token: string, swapper: string = ORACLE_SWAPPER): Promise<number> {
  const res = await fetch(`${config.uniswap.base()}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": config.uniswap.key() },
    body: JSON.stringify({
      type: "EXACT_INPUT",
      tokenIn: token,
      tokenOut: config.addrs.usdcNative(),
      amount: "1000000000000000000", // 1 unit (18dp asset)
      tokenInChainId: 137,
      tokenOutChainId: 137,
      swapper,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Uniswap quote ${res.status}`);
  const q = await res.json();
  const quote = q?.quote;
  const quoteIsObject = quote != null && typeof quote === "object";

  const swapperOut = (quoteIsObject ? quote.swapper : undefined) ?? q?.swapper;
  if (!swapperOut) throw new Error("Uniswap quote missing `swapper`");

  // Verified: quote.output.amount is the USDC (6dp) output amount as a decimal string.
  const out = quoteIsObject ? quote.output?.amount : typeof quote === "string" ? quote : undefined;
  if (out == null) throw new Error("Uniswap quote missing output amount");
  return Number(out) / 1e6;
}
