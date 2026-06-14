import YahooFinance from "yahoo-finance2";

const TIMEOUT_MS = 6000;

// yahoo-finance2 v3 exports a class to instantiate (v2 exported a ready-made instance).
const yahooFinance = new YahooFinance();

export type AnalystBand = { low: number; high: number; mean?: number };

/** Live (free) published analyst bear/bull price-target band for a stock (e.g. NVDA) from Yahoo
 *  Finance (`financialData.targetLowPrice` / `targetHighPrice`). This is the band the asset price's
 *  percentile is measured within (bear=low, bull=high) — display/intelligence only, NOT used for any
 *  on-chain execution. Throws when targets are missing/invalid or `high <= low` so callers can fall
 *  back to a seed band (Yahoo has no targets for ETFs/crypto, which is the intended fallback path).
 *  Yahoo is the unofficial endpoint (no API key, ~15-20min delay); yahoo-finance2 handles the
 *  cookie/crumb so server-side calls are reliable. `validateResult: false` keeps Yahoo's occasional
 *  extra fields from throwing schema errors on otherwise-valid data. */
export async function fetchAnalystBand(symbol: string): Promise<AnalystBand> {
  const r = await yahooFinance.quoteSummary(
    symbol,
    { modules: ["financialData"] },
    { validateResult: false, fetchOptions: { signal: AbortSignal.timeout(TIMEOUT_MS) } },
  );
  const fd = (r as { financialData?: Record<string, unknown> })?.financialData;
  const low = Number(fd?.targetLowPrice);
  const high = Number(fd?.targetHighPrice);
  const mean = Number(fd?.targetMeanPrice);
  if (!Number.isFinite(low) || !Number.isFinite(high) || low <= 0 || high <= low) {
    throw new Error(`Yahoo: no valid analyst band for ${symbol}`);
  }
  return { low, high, mean: Number.isFinite(mean) ? mean : undefined };
}
