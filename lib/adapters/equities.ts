import { config } from "@/lib/config";

const TIMEOUT_MS = 6000;

export type EquityQuote = { price: number; changePct: number };

/** Display-only equity quote (e.g. NVDA): current price + daily percent change from a Finnhub-style
 *  endpoint (`{ c: currentPrice, dp: dailyPercentChange }`). `changePct` defaults to 0 when `dp` is
 *  absent. Throws if the key/feed is unavailable (or price is 0/NaN) so callers can fall back to a
 *  seed value. This is NOT used for any on-chain execution. */
export async function fetchEquityQuote(symbol: string): Promise<EquityQuote> {
  const key = config.equitiesKey();
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Equities ${res.status}`);
  const q = await res.json();
  const price = Number(q.c);
  if (!price || Number.isNaN(price)) throw new Error("Equities: no current price");
  const dp = Number(q.dp);
  return { price, changePct: Number.isFinite(dp) ? dp : 0 };
}

/** Convenience: just the spot price (the analyst-band percentile input). Delegates to fetchEquityQuote. */
export async function fetchEquityPrice(symbol: string): Promise<number> {
  return (await fetchEquityQuote(symbol)).price;
}
