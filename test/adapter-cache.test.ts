import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cached, __resetCache } from "@/lib/adapters/cache";

// cache.ts bypasses caching under NODE_ENV==="test" (so adapter unit tests hit their mocks each call);
// flip to a non-test env here so the cache itself is actually exercised.
beforeEach(() => {
  __resetCache();
  vi.stubEnv("NODE_ENV", "production");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("cached() — TTL adapter cache", () => {
  it("returns the cached value within the TTL (one upstream call for repeated reads)", async () => {
    const fn = vi.fn(async () => 1);
    expect(await cached("k", 1000, fn)).toBe(1);
    expect(await cached("k", 1000, fn)).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("dedups concurrent calls into a single in-flight request", async () => {
    let resolve!: (n: number) => void;
    const fn = vi.fn(() => new Promise<number>((r) => (resolve = r)));
    const a = cached("k", 1000, fn);
    const b = cached("k", 1000, fn);
    resolve(7);
    expect(await a).toBe(7);
    expect(await b).toBe(7);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("re-fetches after the TTL expires", async () => {
    vi.useFakeTimers();
    let n = 0;
    const fn = vi.fn(async () => ++n);
    expect(await cached("k", 1000, fn)).toBe(1);
    vi.advanceTimersByTime(1001);
    expect(await cached("k", 1000, fn)).toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("serves the last-good value when the upstream later throws (stale-on-error)", async () => {
    const fn = vi.fn();
    fn.mockResolvedValueOnce(42);
    expect(await cached("k", 0, fn)).toBe(42); // ttl 0 -> the next read is a miss
    fn.mockRejectedValueOnce(new Error("429"));
    expect(await cached("k", 0, fn)).toBe(42); // stale-on-error returns last-good
  });

  it("rethrows when the upstream fails and there is no prior value", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("down"));
    await expect(cached("k", 1000, fn)).rejects.toThrow(/down/);
  });

  it("negative-caches a failure (fast-fails within errorTtl without re-hitting the upstream)", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("429"));
    await expect(cached("k", 1000, fn, 5000)).rejects.toThrow(/429/);
    await expect(cached("k", 1000, fn, 5000)).rejects.toThrow(/429/);
    expect(fn).toHaveBeenCalledTimes(1); // second call served from the negative cache (no upstream hit)
  });

  it("bypasses caching under NODE_ENV=test (every call hits the upstream)", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const fn = vi.fn(async () => 1);
    await cached("k", 1000, fn);
    await cached("k", 1000, fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
