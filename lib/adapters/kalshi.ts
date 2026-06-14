import { cached } from "./cache";

const BASE = "https://api.elections.kalshi.com/trade-api/v2";
const TIMEOUT_MS = 6000;
const TTL_MS = 30_000;

export type KalshiOdds = { prob: number; volume: number; openInterest: number };

const numOr = (v: unknown, d = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/** Kalshi quotes prices either as `*_dollars` strings (0.xx) or as integer cents (1–99). Prefer the
 *  dollars field; otherwise divide cents by 100. Returns NaN when neither is a positive number. */
const price = (dollars: unknown, cents: unknown): number => {
  const d = Number(dollars);
  if (Number.isFinite(d) && d > 0) return d;
  const c = Number(cents);
  if (Number.isFinite(c) && c > 0) return c / 100;
  return NaN;
};

async function fetchKalshiOddsFresh(ticker: string): Promise<KalshiOdds> {
  const res = await fetch(`${BASE}/markets/${encodeURIComponent(ticker)}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Kalshi ${res.status}`);
  const m = (await res.json())?.market;
  if (!m) throw new Error("Kalshi: no market");
  // Drop anything not actively trading — a settled/closed market reports a finalized 0/100 that would
  // poison the belief aggregate. Surfaced as a failure so the engine falls back to the seed / drops it.
  if (m.status && m.status !== "active") throw new Error(`Kalshi: market ${m.status}`);
  // YES probability: bid/ask mid when a book exists, else the last trade.
  const bid = price(m.yes_bid_dollars, m.yes_bid);
  const ask = price(m.yes_ask_dollars, m.yes_ask);
  const mid = Number.isFinite(bid) && Number.isFinite(ask) ? (bid + ask) / 2 : NaN;
  const last = price(m.last_price_dollars, m.last_price);
  const prob = Number.isFinite(mid) ? mid : last;
  if (!Number.isFinite(prob) || prob <= 0 || prob >= 1) throw new Error("Kalshi: no valid YES price");
  return { prob, volume: numOr(m.volume) || numOr(m.volume_24h), openInterest: numOr(m.open_interest) };
}

/** Live YES odds + liquidity for a Kalshi market (read-only belief input; never used for execution).
 *  Cache-wrapped (TTL + dedup + stale-on-error); throws on settled/closed/no-price so the belief engine
 *  drops it or falls back to the seed. */
export async function fetchKalshiOdds(ticker: string): Promise<KalshiOdds> {
  return cached(`kalshi:odds:${ticker}`, TTL_MS, () => fetchKalshiOddsFresh(ticker));
}
