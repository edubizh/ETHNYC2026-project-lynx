import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TRADES_URL = "https://api.elections.kalshi.com/trade-api/v2/markets/trades?limit=500";

// General finance universe (sports excluded) — the always-available fallback / backfill set.
const GENERAL = [
  "KXBTC", "KXETH", "KXSOL", "KXHYPE", "KXXRP", "KXDOGE", "KXADA", "KXLINK", "KXLTC", "KXAVAX",
  "KXFED", "KXCPI", "KXINX", "KXNASDAQ", "KXGDP", "KXOIL", "KXGAS", "KXJOBS", "KXPAYROLL",
  "KXRATE", "KXRECESS", "KXSP", "KXINFL", "KXUNEMP",
  "KXPRES", "KXTRUMP", "KXSENATE", "KXGOV", "KXHOUSE", "KXPOLITICS", "KXDEM", "KXGOP",
];

// Per-theme relevant series — the feed PRIORITIZES these for the bucket it's shown in, then
// backfills from GENERAL when too few are trading so it never looks dead ("safely able to").
const THEME: Record<string, string[]> = {
  crypto: ["KXBTC", "KXETH", "KXSOL", "KXHYPE", "KXXRP", "KXDOGE", "KXADA", "KXLINK", "KXLTC", "KXAVAX"],
  macro: ["KXFED", "KXCPI", "KXGDP", "KXINX", "KXNASDAQ", "KXSP", "KXOIL", "KXGAS", "KXJOBS", "KXPAYROLL", "KXRATE", "KXRECESS", "KXINFL", "KXUNEMP"],
  "us-politics": ["KXPRES", "KXTRUMP", "KXSENATE", "KXGOV", "KXHOUSE", "KXDEM", "KXGOP", "KXNYC", "KXMAYOR", "KXSPEAKER"],
  geopolitics: ["KXPRES", "KXTRUMP", "KXUKRAINE", "KXRUSSIA", "KXISRAEL", "KXIRAN", "KXCHINA", "KXTAIWAN", "KXNATO", "KXWAR"],
  // AI has no liquid Kalshi market of its own → use crypto + equity indices as a tech/risk-on proxy.
  ai: ["KXBTC", "KXETH", "KXSOL", "KXNASDAQ", "KXINX"],
};

const FLOOR = 8; // min theme-relevant trades in the window before we stop backfilling
const series = (tk: string) => tk.replace(/^KX/, "").split("-")[0];
const startsAny = (tk: string, pfx: string[]) => pfx.some((p) => tk.startsWith(p));

type KTrade = { trade_id?: string; ticker?: string; taker_side?: string; yes_price_dollars?: string; count_fp?: string; created_time?: string };

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const themePfx = THEME[slug] ?? [];
  try {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 8000);
    const r = await fetch(TRADES_URL, { signal: ac.signal, headers: { accept: "application/json" } });
    clearTimeout(to);
    if (!r.ok) return NextResponse.json({ items: [] });
    const j = (await r.json()) as { trades?: KTrade[] };

    const general = (j.trades ?? []).filter((t) => startsAny(String(t.ticker ?? "").toUpperCase(), GENERAL));
    const relevant = themePfx.length ? general.filter((t) => startsAny(String(t.ticker ?? "").toUpperCase(), themePfx)) : [];
    // theme-relevant first; backfill from general only when relevant is too thin to flow
    const ordered = relevant.length >= FLOOR ? relevant : [...relevant, ...general];

    const seen = new Set<string>();
    const items = ordered
      .filter((t) => {
        const id = String(t.trade_id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(0, 40)
      .map((t) => ({
        id: String(t.trade_id),
        ticker: series(String(t.ticker ?? "")),
        side: t.taker_side === "no" ? "NO" : "YES",
        price: Number(t.yes_price_dollars),
        count: Number(t.count_fp),
        ts: Date.parse(t.created_time ?? "") || Date.now(),
      }));
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
