import { describe, it, expect } from "vitest";
import {
  DEFAULT_CONFIG,
  FEED_IDS,
  parseConfig,
  serializeConfig,
  terminalReducer,
  visibleFeeds,
  type TerminalConfig,
} from "@/lib/live/terminalConfig";

describe("terminalConfig reducer", () => {
  it("setFeed swaps the feed in one slot only", () => {
    const next = terminalReducer(DEFAULT_CONFIG, { kind: "setFeed", side: "left", pos: "top", feed: "price-ticker" });
    expect(next.left.top).toBe("price-ticker");
    expect(next.left.bottom).toBe(DEFAULT_CONFIG.left.bottom); // untouched
    expect(next.right).toEqual(DEFAULT_CONFIG.right); // other side untouched
  });

  it("toggleSplit flips a side between single and split", () => {
    const split = terminalReducer(DEFAULT_CONFIG, { kind: "toggleSplit", side: "left" });
    expect(split.left.mode).toBe("split");
    const back = terminalReducer(split, { kind: "toggleSplit", side: "left" });
    expect(back.left.mode).toBe("single");
  });

  it("toggleHidden flips visibility", () => {
    expect(terminalReducer(DEFAULT_CONFIG, { kind: "toggleHidden" }).hidden).toBe(true);
  });

  it("accepts a full config object (hydrate path)", () => {
    const hydrated: TerminalConfig = { ...DEFAULT_CONFIG, hidden: true };
    expect(terminalReducer(DEFAULT_CONFIG, hydrated)).toEqual(hydrated);
  });

  it("does not mutate the input state", () => {
    const before = JSON.stringify(DEFAULT_CONFIG);
    terminalReducer(DEFAULT_CONFIG, { kind: "setFeed", side: "right", pos: "bottom", feed: "belief-odds" });
    expect(JSON.stringify(DEFAULT_CONFIG)).toBe(before);
  });
});

describe("visibleFeeds", () => {
  it("returns 1 feed when single, 2 when split", () => {
    expect(visibleFeeds({ mode: "single", top: "belief-book", bottom: "belief-odds" })).toEqual(["belief-book"]);
    expect(visibleFeeds({ mode: "split", top: "belief-book", bottom: "belief-odds" })).toEqual([
      "belief-book",
      "belief-odds",
    ]);
  });
});

describe("config persistence (serialize/parse)", () => {
  it("round-trips a config", () => {
    const c: TerminalConfig = terminalReducer(DEFAULT_CONFIG, { kind: "toggleSplit", side: "left" });
    expect(parseConfig(serializeConfig(c))).toEqual(c);
  });

  it("falls back to default on null / garbage", () => {
    expect(parseConfig(null)).toEqual(DEFAULT_CONFIG);
    expect(parseConfig("{not json")).toEqual(DEFAULT_CONFIG);
  });

  it("repairs unknown feed ids and missing fields", () => {
    const parsed = parseConfig(JSON.stringify({ left: { mode: "split", top: "bogus" }, right: {} }));
    expect(parsed.left.mode).toBe("split");
    expect(FEED_IDS).toContain(parsed.left.top); // bogus -> repaired to a valid default
    expect(parsed.right).toEqual(DEFAULT_CONFIG.right);
    expect(parsed.hidden).toBe(false);
  });
});
