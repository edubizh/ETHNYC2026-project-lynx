import { config } from "@/lib/config";

const TIMEOUT_MS = 6000;

/** Display-only equity spot price (e.g. NVDA) for the analyst-band percentile in the AI Sentiment Gap.
 *  Uses a Finnhub-style quote endpoint (`{ c: currentPrice }`). Throws if the key/feed is unavailable so
 *  callers can fall back to a seed value. This is NOT used for any on-chain execution. */
export async function fetchEquityPrice(symbol: string): Promise<number> {
  const key = config.equitiesKey();
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Equities ${res.status}`);
  const q = await res.json();
  const price = Number(q.c);
  if (!price || Number.isNaN(price)) throw new Error("Equities: no current price");
  return price;
}
