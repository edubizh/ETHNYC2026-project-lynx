/** Gamma returns `outcomes` and `outcomePrices` as STRINGIFIED JSON arrays — JSON.parse before indexing. */
export async function fetchBeliefProb(gammaMarketId: string): Promise<number> {
  const res = await fetch(`https://gamma-api.polymarket.com/markets/${gammaMarketId}`);
  if (!res.ok) throw new Error(`Gamma ${res.status}`);
  const m = await res.json();
  const outcomes: string[] = JSON.parse(m.outcomes);
  const prices: string[] = JSON.parse(m.outcomePrices);
  const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === "yes");
  return Number(prices[yesIdx >= 0 ? yesIdx : 0]);
}
