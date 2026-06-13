const TIMEOUT_MS = 6000;

/** Gamma returns `outcomes` and `outcomePrices` as STRINGIFIED JSON arrays — JSON.parse before indexing.
 *  Throws (rather than silently using index 0) if the YES outcome is absent or the price is non-numeric,
 *  so a bad market id surfaces loudly and the dashboard falls back to a verified seed. */
export async function fetchBeliefProb(gammaMarketId: string): Promise<number> {
  const res = await fetch(`https://gamma-api.polymarket.com/markets/${gammaMarketId}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Gamma ${res.status}`);
  const m = await res.json();
  const outcomes: string[] = JSON.parse(m.outcomes);
  const prices: string[] = JSON.parse(m.outcomePrices);
  const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === "yes");
  if (yesIdx < 0) throw new Error("Gamma: no YES outcome");
  const p = Number(prices[yesIdx]);
  if (!Number.isFinite(p)) throw new Error("Gamma: non-numeric YES price");
  return p;
}
