import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Uniswap v4 swaps on Base (the live venue — v3 pools migrated to v4). The PoolManager emits
// poolId-keyed Swap events; we label poolIds via GeckoTerminal (its v4-base pool `address` IS the
// bytes32 poolId) and decode amount0/amount1. Base v4 flows ~300+ swaps/min — a real firehose.
const RPC = "https://base-rpc.publicnode.com";
const POOL_MANAGER = "0x498581fF718922c3f8e6A244956aF099B2652b2b";
const SWAP_TOPIC = "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f";
const GT = "https://api.geckoterminal.com/api/v2/networks/base/dexes/uniswap-v4-base/pools?page=1&sort=h24_volume_usd_desc&include=base_token,quote_token";
const STABLES = new Set(["USDC", "USDBC", "USDT", "DAI", "USDS", "USDC.E"]);
const POOL_TTL = 5 * 60 * 1000;

type Tok = { sym: string; dec: number; addr: string };
type PoolInfo = { pair: string; c0: Tok; c1: Tok }; // c0 = lower address == currency0
let poolMap: Record<string, PoolInfo> = {};
let poolFetched = 0;

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: ac.signal,
    });
    const j = (await r.json()) as { result?: unknown };
    return j.result;
  } finally {
    clearTimeout(to);
  }
}

async function ensurePoolMap(): Promise<void> {
  if (Object.keys(poolMap).length && Date.now() - poolFetched < POOL_TTL) return;
  try {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 8000);
    const r = await fetch(GT, { signal: ac.signal, headers: { accept: "application/json" } });
    clearTimeout(to);
    if (!r.ok) return;
    const j = (await r.json()) as {
      data?: { attributes?: { address?: string }; relationships?: Record<string, { data?: { id?: string } }> }[];
      included?: { id: string; attributes: { symbol?: string; decimals?: number; address?: string } }[];
    };
    const inc: Record<string, { symbol?: string; decimals?: number; address?: string }> = {};
    for (const x of j.included ?? []) inc[x.id] = x.attributes;
    const map: Record<string, PoolInfo> = {};
    for (const p of j.data ?? []) {
      const poolId = String(p.attributes?.address ?? "").toLowerCase();
      const bt = inc[p.relationships?.base_token?.data?.id ?? ""];
      const qt = inc[p.relationships?.quote_token?.data?.id ?? ""];
      if (!poolId || !bt || !qt) continue;
      const mk = (t: typeof bt): Tok => ({ sym: String(t.symbol), dec: Number(t.decimals), addr: String(t.address).toLowerCase() });
      const a0 = mk(bt);
      const a1 = mk(qt);
      const [c0, c1] = a0.addr < a1.addr ? [a0, a1] : [a1, a0];
      map[poolId] = { pair: `${bt.symbol}/${qt.symbol}`, c0, c1 };
    }
    if (Object.keys(map).length) {
      poolMap = map;
      poolFetched = Date.now();
    }
  } catch {
    /* keep any stale map */
  }
}

function signed128(word: string): bigint {
  let v = BigInt("0x" + word);
  if (v >= 1n << 255n) v -= 1n << 256n;
  return v;
}

type SwapItem = { id: string; pair: string; side: "BUY" | "SELL"; size: number; unit: string; block: number };

export async function GET() {
  await ensurePoolMap();
  if (!Object.keys(poolMap).length) return NextResponse.json({ items: [] });
  try {
    const latestHex = (await rpc("eth_blockNumber", [])) as string | undefined;
    if (!latestHex) return NextResponse.json({ items: [] });
    const from = "0x" + (parseInt(latestHex, 16) - 8).toString(16);
    const logs = (await rpc("eth_getLogs", [
      { address: POOL_MANAGER, topics: [SWAP_TOPIC], fromBlock: from, toBlock: latestHex },
    ])) as { topics?: string[]; data?: string; transactionHash?: string; logIndex?: string; blockNumber?: string }[] | undefined;
    if (!Array.isArray(logs)) return NextResponse.json({ items: [] });

    const items: SwapItem[] = [];
    for (const l of logs) {
      const poolId = String(l.topics?.[1] ?? "").toLowerCase();
      const info = poolMap[poolId];
      if (!info) continue; // only top/labeled pools
      const data = String(l.data ?? "0x").slice(2);
      if (data.length < 128) continue;
      const amt0 = signed128(data.slice(0, 64));
      const amt1 = signed128(data.slice(64, 128));
      const buy = amt0 < 0n; // pool sent currency0 out => user bought currency0
      // Pick a readable leg: stablecoin -> $, else ETH, else currency0 token.
      const s0 = STABLES.has(info.c0.sym.toUpperCase());
      const s1 = STABLES.has(info.c1.sym.toUpperCase());
      const e0 = /^W?ETH$/i.test(info.c0.sym);
      const e1 = /^W?ETH$/i.test(info.c1.sym);
      const pick = s1
        ? { amt: amt1, t: info.c1, unit: "$" }
        : s0
          ? { amt: amt0, t: info.c0, unit: "$" }
          : e1
            ? { amt: amt1, t: info.c1, unit: "Ξ" }
            : e0
              ? { amt: amt0, t: info.c0, unit: "Ξ" }
              : { amt: amt0, t: info.c0, unit: info.c0.sym };
      const abs = pick.amt < 0n ? -pick.amt : pick.amt;
      items.push({
        id: `${l.transactionHash}-${l.logIndex}`,
        pair: info.pair,
        side: buy ? "BUY" : "SELL",
        size: Number(abs) / 10 ** pick.t.dec,
        unit: pick.unit,
        block: parseInt(String(l.blockNumber), 16),
      });
    }
    items.reverse(); // newest first
    return NextResponse.json({ items: items.slice(0, 40) });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
