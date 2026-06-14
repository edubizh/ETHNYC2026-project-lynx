import { NextResponse } from "next/server";
import { getTheme } from "@/lib/baskets/registry";
import type { AssetLeg } from "@/lib/baskets/types";

export const dynamic = "force-dynamic";

const BLOCKSCOUT = "https://polygon.blockscout.com/api/v2/tokens";
const TIMEOUT_MS = 7000;
const PER_TOKEN = 6;
const MAX = 14;

type Item = { total?: { value?: string; decimals?: string }; transaction_hash?: string; timestamp?: string };

/** Live on-chain transfers of a theme's basket tokens (Polygon, via Blockscout — no key).
 *  Client polls this; server-side fetch avoids the browser CORS block. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  let assets: AssetLeg[];
  try {
    assets = getTheme(slug).legs.filter((l): l is AssetLeg => l.kind === "asset");
  } catch {
    return NextResponse.json({ swaps: [] });
  }

  const perToken = await Promise.all(
    assets.map(async (a) => {
      try {
        const ac = new AbortController();
        const to = setTimeout(() => ac.abort(), TIMEOUT_MS);
        const res = await fetch(`${BLOCKSCOUT}/${a.token}/transfers`, {
          signal: ac.signal,
          headers: { accept: "application/json" },
        });
        clearTimeout(to);
        if (!res.ok) return [];
        const json = (await res.json()) as { items?: Item[] };
        return (json.items ?? []).slice(0, PER_TOKEN).map((it) => ({
          ticker: a.ticker,
          amount: Number(it.total?.value ?? 0) / 10 ** Number(it.total?.decimals ?? 18),
          hash: String(it.transaction_hash ?? ""),
          ts: Date.parse(it.timestamp ?? "") || Date.now(),
        }));
      } catch {
        return [];
      }
    }),
  );

  // One row per transaction (a swap can emit several transfers of the same token) — keep the largest.
  const byHash = new Map<string, { ticker: string; amount: number; hash: string; ts: number }>();
  for (const s of perToken.flat()) {
    if (!(s.amount > 0) || !s.hash) continue;
    const ex = byHash.get(s.hash);
    if (!ex || s.amount > ex.amount) byHash.set(s.hash, s);
  }
  const swaps = [...byHash.values()].sort((a, b) => b.ts - a.ts).slice(0, MAX);

  return NextResponse.json({ swaps });
}
