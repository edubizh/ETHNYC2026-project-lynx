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
    const next = terminalReducer(DEFAULT_CONFIG, { kind: "setFeed", side: "left", pos: "top", feed: "uniswap" });
    expect(next.left.top).toBe("uniswap");
    expect(next.left.bottom).toBe(DEFAULT_CONFIG.left.bottom); // untouched
    expect(next.right).toEqual(DEFAULT_CONFIG.right); // other side untouched
  });

  it("toggleSplit flips a side between single and split", () => {
    const start = DEFAULT_CONFIG.left.mode;
    const once = terminalReducer(DEFAULT_CONFIG, { kind: "toggleSplit", side: "left" });
    expect(once.left.mode).not.toBe(start);
    const twice = terminalReducer(once, { kind: "toggleSplit", side: "left" });
    expect(twice.left.mode).toBe(start);
  });

  it("toggleHidden flips visibility", () => {
    expect(terminalReducer(DEFAULT_CONFIG, { kind: "toggleHidden" }).hidden).toBe(true);
  });

  it("closeFeed on a split side → single, keeping the other slot", () => {
    const cfg: TerminalConfig = {
      left: { mode: "split", top: "polymarket", bottom: "kalshi" },
      right: { mode: "single", top: "hyperliquid", bottom: "uniswap" },
      hidden: false,
    };
    const closedTop = terminalReducer(cfg, { kind: "closeFeed", side: "left", pos: "top" });
    expect(closedTop.left.mode).toBe("single");
    expect(closedTop.left.top).toBe("kalshi"); // surviving feed promoted to top
    const closedBottom = terminalReducer(cfg, { kind: "closeFeed", side: "left", pos: "bottom" });
    expect(closedBottom.left.mode).toBe("single");
    expect(closedBottom.left.top).toBe("polymarket");
  });

  it("closeFeed on a single side → empty (gutter cleared)", () => {
    const single: TerminalConfig = {
      left: { mode: "single", top: "polymarket", bottom: "kalshi" },
      right: { mode: "single", top: "hyperliquid", bottom: "uniswap" },
      hidden: false,
    };
    const emptied = terminalReducer(single, { kind: "closeFeed", side: "right", pos: "top" });
    expect(emptied.right.mode).toBe("empty");
    expect(visibleFeeds(emptied.right)).toEqual([]);
  });

  it("addFeed re-opens a gutter: empty → single → split (with a distinct second feed)", () => {
    const empty: TerminalConfig = {
      left: { mode: "empty", top: "polymarket", bottom: "kalshi" },
      right: { mode: "single", top: "hyperliquid", bottom: "uniswap" },
      hidden: false,
    };
    const reopened = terminalReducer(empty, { kind: "addFeed", side: "left" });
    expect(reopened.left.mode).toBe("single");
    const split = terminalReducer(reopened, { kind: "addFeed", side: "left" });
    expect(split.left.mode).toBe("split");
    expect(split.left.bottom).not.toBe(split.left.top); // second slot differs
    expect(visibleFeeds(split.left)).toHaveLength(2);
  });

  it("accepts a full config object (hydrate path)", () => {
    const hydrated: TerminalConfig = { ...DEFAULT_CONFIG, hidden: true };
    expect(terminalReducer(DEFAULT_CONFIG, hydrated)).toEqual(hydrated);
  });

  it("does not mutate the input state", () => {
    const before = JSON.stringify(DEFAULT_CONFIG);
    terminalReducer(DEFAULT_CONFIG, { kind: "setFeed", side: "right", pos: "bottom", feed: "kalshi" });
    expect(JSON.stringify(DEFAULT_CONFIG)).toBe(before);
  });
});

describe("visibleFeeds", () => {
  it("returns 1 feed when single, 2 when split", () => {
    expect(visibleFeeds({ mode: "single", top: "uniswap", bottom: "kalshi" })).toEqual(["uniswap"]);
    expect(visibleFeeds({ mode: "split", top: "uniswap", bottom: "kalshi" })).toEqual([
      "uniswap",
      "kalshi",
    ]);
  });

  it("returns 0 feeds when empty", () => {
    expect(visibleFeeds({ mode: "empty", top: "uniswap", bottom: "kalshi" })).toEqual([]);
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
