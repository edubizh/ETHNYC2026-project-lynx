import { describe, it, expect } from "vitest";
import { FEED_IDS } from "@/lib/live/terminalConfig";
import { FEED_CATALOG, FEED_LIST } from "@/lib/live/feeds";

describe("feed catalog", () => {
  it("has a complete descriptor for every FeedId", () => {
    for (const id of FEED_IDS) {
      const d = FEED_CATALOG[id];
      expect(d, `missing catalog entry for ${id}`).toBeDefined();
      expect(d.id).toBe(id);
      expect(typeof d.label).toBe("string");
      expect(d.label.length).toBeGreaterThan(0);
      expect(typeof d.Component).toBe("function");
      expect(["market", "assets", "equity"]).toContain(d.needs);
    }
  });

  it("FEED_LIST covers exactly the catalog", () => {
    expect(FEED_LIST.length).toBe(FEED_IDS.length);
    expect(new Set(FEED_LIST.map((f) => f.id)).size).toBe(FEED_IDS.length);
  });
});
