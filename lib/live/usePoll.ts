"use client";
import { useEffect, useRef, useState } from "react";

export type PollStatus = "loading" | "live" | "error";
export type PollState<T> = { data: T | null; status: PollStatus };

/** Generic interval poller. Keeps the last good `data` on error (status flips to "error" but the UI
 *  doesn't blank out) — mirrors the dashboard's graceful-fallback ethos (lib/dashboard/service.ts). */
export function usePoll<T>(url: string | null, intervalMs: number): PollState<T> {
  const [state, setState] = useState<PollState<T>>({ data: null, status: "loading" });
  const dataRef = useRef<T | null>(null);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    const tick = async () => {
      const ac = new AbortController();
      const to = setTimeout(() => ac.abort(), Math.min(intervalMs, 8000));
      try {
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as T;
        if (!alive) return;
        dataRef.current = json;
        setState({ data: json, status: "live" });
      } catch {
        if (alive) setState({ data: dataRef.current, status: "error" });
      } finally {
        clearTimeout(to);
      }
    };

    tick();
    timer = setInterval(tick, intervalMs);
    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [url, intervalMs]);

  return state;
}
