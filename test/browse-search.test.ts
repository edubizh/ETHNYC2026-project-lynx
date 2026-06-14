import { describe, it, expect } from "vitest";
import { filterThemes } from "@/lib/browse/search";
import { seedMindshareView } from "@/lib/mindshare";

const ranked = seedMindshareView().ranked; // the 5 real buckets, with real securities

describe("filterThemes (header search over the bucket list)", () => {
  it("returns every theme for an empty / whitespace query (no filter)", () => {
    expect(filterThemes(ranked, "")).toHaveLength(ranked.length);
    expect(filterThemes(ranked, "   ")).toHaveLength(ranked.length);
  });

  it("matches by theme title, case-insensitively", () => {
    const r = filterThemes(ranked, "ai");
    expect(r.map((t) => t.slug)).toContain("ai");
  });

  it("matches by a security ticker the theme carries (e.g. NVDA -> AI)", () => {
    const r = filterThemes(ranked, "nvda");
    expect(r.map((t) => t.slug)).toEqual(["ai"]);
  });

  it("matches by a security name substring (e.g. 'defense' -> geopolitics)", () => {
    const r = filterThemes(ranked, "defense");
    expect(r.map((t) => t.slug)).toContain("geopolitics");
  });

  it("matches 'fed' to the Macro & Fed theme by title", () => {
    const r = filterThemes(ranked, "fed");
    expect(r.map((t) => t.slug)).toContain("macro");
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterThemes(ranked, "zzzznomatch")).toEqual([]);
  });
});
