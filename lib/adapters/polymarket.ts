import type { Window } from "@/lib/mindshare";

const TIMEOUT_MS = 6000;

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** All-window trade volume for a Gamma market in ONE fetch. 24h→volume24hr, 7d→volume1wk,
 *  30d→volume1mo, 3m→volumeNum (Gamma exposes no 90-day bucket, so 3M uses the broadest available
 *  window — effectively all-time/since-inception). Missing/non-numeric fields read as 0. Throws on a
 *  non-OK response so callers fall back to seeds.
 *  NOTE: the "+ tokenized securities" part of bucket activity is intentionally omitted — the off-rail
 *  securities (NVDA/TLT/…) have no clean 24h on-chain volume, so belief-market volume is the proxy. */
export async function fetchMarketVolumes(gammaMarketId: string): Promise<Record<Window, number>> {
  const res = await fetch(`https://gamma-api.polymarket.com/markets/${gammaMarketId}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Gamma ${res.status}`);
  const m = await res.json();
  return { "24h": num(m.volume24hr), "7d": num(m.volume1wk), "30d": num(m.volume1mo), "3m": num(m.volumeNum) };
}

/** Gamma returns `outcomes` and `outcomePrices` as STRINGIFIED JSON arrays — JSON.parse before indexing.
 *  Throws (rather than silently using index 0) if the YES outcome is absent or the price is non-numeric,
 *  so a bad market id surfaces loudly and the dashboard falls back to a verified seed. */
export async function fetchBeliefProb(gammaMarketId: string): Promise<number> {
  const res = await fetch(`https://gamma-api.polymarket.com/markets/${gammaMarketId}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Gamma ${res.status}`);
  const m = await res.json();
  // A resolved/closed market returns settled 0/1 prices; surface it as a feed failure so the dashboard
  // degrades to the verified seed (tagged `fallback`) rather than showing a fake "live" 100%/0%.
  if (m.closed === true || m.active === false) throw new Error("Gamma: market closed/resolved");
  const outcomes: string[] = JSON.parse(m.outcomes);
  const prices: string[] = JSON.parse(m.outcomePrices);
  const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === "yes");
  if (yesIdx < 0) throw new Error("Gamma: no YES outcome");
  const p = Number(prices[yesIdx]);
  if (!Number.isFinite(p)) throw new Error("Gamma: non-numeric YES price");
  return p;
}
