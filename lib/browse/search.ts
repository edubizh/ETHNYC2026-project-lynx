import { getSecurities } from "@/lib/baskets/registry";
import type { RankedTheme } from "@/lib/mindshare";

/** Client-side treemap filter for the header search. A theme matches when the query (case-insensitive,
 *  trimmed) is a substring of its title OR of any security it carries (ticker or name). An empty query
 *  returns the list unchanged (no filter). Client-safe: registry imports only types, never lib/config. */
export function filterThemes(ranked: RankedTheme[], query: string): RankedTheme[] {
  const q = query.trim().toLowerCase();
  if (!q) return ranked;
  return ranked.filter((r) => {
    if (r.title.toLowerCase().includes(q)) return true;
    return getSecurities(r.slug).some(
      (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    );
  });
}
