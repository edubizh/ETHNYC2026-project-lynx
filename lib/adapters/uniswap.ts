import { config } from "@/lib/config";
import { cached } from "./cache";

// A read-only price quote still requires a `swapper` in the request; this placeholder is never executed.
const ORACLE_SWAPPER = "0x000000000000000000000000000000000000dEaD";
const TIMEOUT_MS = 6000;

/** DISPLAY price of 1 unit of `token` in USDC via the Uniswap Trading API /quote oracle, cached 15s.
 *  Use this for dashboards/treemap reads ONLY. The real-money slippage-floor path (resolveAssetMinOut)
 *  MUST use fetchAssetPriceFresh — a stale price must never set an on-chain minAmountOut. */
export async function fetchAssetPrice(
  token: string,
  opts: { swapper?: string; decimals?: number } = {},
): Promise<number> {
  return cached(`uni:price:${token.toLowerCase()}:${opts.decimals ?? 18}`, 15_000, () =>
    fetchAssetPriceFresh(token, opts),
  );
}

/** UNCACHED live /quote — for the execution path (slippage floor) where a fresh price is mandatory.
 *  VERIFIED shape (2026-06-13): the response is `{ routing, quote, permitData }` where `quote` is an
 *  OBJECT — the output amount is `quote.output.amount` (string, USDC 6dp) and the swapper is nested at
 *  `quote.swapper`. We stay tolerant of a flat `{ quote: "<amount>", swapper }` shape as a fallback. */
export async function fetchAssetPriceFresh(
  token: string,
  opts: { swapper?: string; decimals?: number } = {},
): Promise<number> {
  const swapper = opts.swapper ?? ORACLE_SWAPPER;
  const amount = (10n ** BigInt(opts.decimals ?? 18)).toString(); // one whole unit of the input token (WBTC=8dp!)
  const res = await fetch(`${config.uniswap.base()}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": config.uniswap.key() },
    body: JSON.stringify({
      type: "EXACT_INPUT",
      tokenIn: token,
      tokenOut: config.addrs.usdcNative(),
      amount,
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
