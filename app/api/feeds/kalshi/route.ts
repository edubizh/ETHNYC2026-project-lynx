import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Kalshi market-wide trades (unauthenticated). Filtered to general macro/finance/crypto/politics
// series (sports excluded) — crypto-15m + macro carry consistent flow (~hundreds/min platform-wide).
const TRADES_URL = "https://api.elections.kalshi.com/trade-api/v2/markets/trades?limit=500";
const ALLOW = [
  "KXBTC", "KXETH", "KXSOL", "KXHYPE", "KXXRP", "KXDOGE", "KXADA", "KXLINK", "KXLTC", "KXAVAX",
  "KXFED", "KXCPI", "KXINX", "KXNASDAQ", "KXGDP", "KXOIL", "KXGAS", "KXJOBS", "KXPAYROLL",
  "KXRATE", "KXRECESS", "KXSP", "KXINFL", "KXUNEMP",
  "KXPRES", "KXTRUMP", "KXSENATE", "KXGOV", "KXHOUSE", "KXPOLITICS", "KXDEM", "KXGOP",
];

const series = (tk: string) => tk.replace(/^KX/, "").split("-")[0];

type KTrade = { trade_id?: string; ticker?: string; taker_side?: string; yes_price_dollars?: string; count_fp?: string; created_time?: string };

export async function GET() {
  try {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 8000);
    const r = await fetch(TRADES_URL, { signal: ac.signal, headers: { accept: "application/json" } });
    clearTimeout(to);
    if (!r.ok) return NextResponse.json({ items: [] });
    const j = (await r.json()) as { trades?: KTrade[] };
    const items = (j.trades ?? [])
      .filter((t) => ALLOW.some((p) => String(t.ticker ?? "").toUpperCase().startsWith(p)))
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
