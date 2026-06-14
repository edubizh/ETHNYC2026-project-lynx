import YahooFinance from "yahoo-finance2";
import { cached } from "./cache";

// Yahoo is the unofficial endpoint and is frequently rate-limited (429) from server IPs; its cookie/crumb
// retry can otherwise burn ~5s before failing. Keep the timeout short — the registry seed band is a fine
// fallback — and negative-cache failures for 2min (below) so a rate-limited Yahoo isn't re-hit per request.
const TIMEOUT_MS = 2500;
const ERROR_TTL_MS = 120_000;

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
  return cached(`yh:band:${symbol}`, 600_000, async () => {
    /* live for 10min on success; negative-cached for ERROR_TTL_MS on a 429 so we stop hammering Yahoo */
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
  }, ERROR_TTL_MS);
}
