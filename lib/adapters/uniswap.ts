import { config } from "@/lib/config";

/** Price of 1 unit of `token` in USDC via the Uniswap Trading API /quote (oracle, NOT the prize swap).
 *  Real shape: `q.quote` is a STRING token amount (USDC, 6dp) — there is NO q.quote.output.token.decimals.
 *  A valid quote also carries a `swapper`; treat its absence as an error. */
export async function fetchAssetPrice(token: string): Promise<number> {
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
    }),
  });
  if (!res.ok) throw new Error(`Uniswap quote ${res.status}`);
  const q = await res.json();
  if (!q.swapper) throw new Error("Uniswap quote missing `swapper`");
  // USDC is 6dp; q.quote is the output amount as a decimal string.
  return Number(q.quote) / 1e6;
}
