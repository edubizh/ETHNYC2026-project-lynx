"use client";
import { useEffect, useRef, useState } from "react";

export type TapeStatus = "connecting" | "live" | "disconnected";
export type TapeState<T> = { status: TapeStatus; items: T[] };

/** Polls a tape route returning `{ items: [{ id, ... }] }` and ACCUMULATES new items (deduped by id,
 *  newest-first, capped) so a poll-backed feed reads as a continuous scrolling tape. Used for the
 *  Kalshi + Uniswap feeds (the WS feeds use their own streaming hooks). */
export function useTapePoll<T extends { id: string }>(url: string, intervalMs: number, cap = 50): TapeState<T> {
  const [state, setState] = useState<TapeState<T>>({ status: "connecting", items: [] });
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    seen.current = new Set();

    const tick = async () => {
      const ac = new AbortController();
      const to = setTimeout(() => ac.abort(), Math.min(intervalMs, 8000));
      try {
        const r = await fetch(url, { signal: ac.signal });
        if (!r.ok) throw new Error(String(r.status));
        const j = (await r.json()) as { items?: T[] };
        if (!alive) return;
        const incoming = Array.isArray(j.items) ? j.items : [];
        const fresh = incoming.filter((i) => i && i.id && !seen.current.has(i.id));
        if (fresh.length) {
          fresh.forEach((i) => seen.current.add(i.id));
          setState((s) => ({ status: "live", items: [...fresh, ...s.items].slice(0, cap) }));
          if (seen.current.size > cap * 4) seen.current = new Set([...seen.current].slice(-cap * 2));
        } else {
          setState((s) => ({ ...s, status: "live" }));
        }
      } catch {
        if (alive) setState((s) => ({ ...s, status: s.items.length ? "live" : "disconnected" }));
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
  }, [url, intervalMs, cap]);

  return state;
}
