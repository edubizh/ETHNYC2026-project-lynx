// In-memory TTL cache for read-only upstream feeds (Polymarket/Uniswap/equities/Yahoo). Single-process
// and module-level, so it persists across requests within a server worker — turning the dashboard's
// every-click re-fetch into a warm-cache hit and collapsing the Browse fan-out via in-flight dedup.
//
// Four behaviours that directly fix the slow/flaky loads:
//   1. TTL hit         — within `ttlMs`, return the cached value (no network).
//   2. In-flight dedup — concurrent calls for the same key share ONE request (e.g. WETH priced as both
//                        an asset leg and a security in one render; or 7 buckets hitting the same feed).
//   3. Stale-on-error  — if the upstream throws but we have a previous good value, serve it instead of
//                        failing, so a transient rate-limit (429) keeps the last-good number live.
//   4. Negative cache  — if the upstream keeps failing with NO prior value (e.g. Yahoo analyst-band 429),
//                        cache the failure for `errorTtlMs` so we fast-fail to the seed instead of
//                        re-paying the upstream's multi-second retry/timeout on EVERY request.
//
// Bypassed entirely under NODE_ENV==="test" so unit tests keep exercising each adapter's real fetch path
// against their per-case mocks (the cache itself is covered directly by test/adapter-cache.test.ts).

// Keys are never evicted; this is safe ONLY because the key set is small + bounded (a fixed set of
// tokens/markets/symbols from the registry). Do not key this by unbounded/user input without adding LRU.
type Entry<T> = { ok: true; value: T; expires: number } | { ok: false; error: unknown; expires: number };

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * Cache `fn`'s result under `key` for `ttlMs` (success) / `errorTtlMs` (failure with no prior value),
 * deduping concurrent calls and serving last-good on error.
 */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>, errorTtlMs = 30_000): Promise<T> {
  if (process.env.NODE_ENV === "test") return fn();

  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && Date.now() < hit.expires) {
    if (hit.ok) return hit.value;
    throw hit.error; // negative cache: don't re-hit a feed that just failed
  }

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const p = (async (): Promise<T> => {
    try {
      const value = await fn();
      store.set(key, { ok: true, value, expires: Date.now() + ttlMs });
      return value;
    } catch (err) {
      const prev = store.get(key) as Entry<T> | undefined;
      if (prev && prev.ok) {
        // Serve last-good AND re-arm it for errorTtlMs, so other callers during an outage get the stale
        // value immediately instead of each re-paying the upstream timeout (retry throttle); one caller
        // re-probes the upstream after the window.
        store.set(key, { ok: true, value: prev.value, expires: Date.now() + errorTtlMs });
        return prev.value;
      }
      store.set(key, { ok: false, error: err, expires: Date.now() + errorTtlMs });
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

/** Test-only: drop all cached state (used by the cache's own unit tests). */
export function __resetCache(): void {
  store.clear();
  inflight.clear();
}
