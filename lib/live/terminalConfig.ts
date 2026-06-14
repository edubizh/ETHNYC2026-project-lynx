// Pure layout state + persistence for the customizable terminal side rails.
// No React / no DOM imports here so it stays trivially unit-testable; localStorage access is guarded.

export const FEED_IDS = [
  "belief-book",
  "belief-tape",
  "belief-odds",
  "onchain-swaps",
  "price-ticker",
  "equity-tape",
] as const;
export type FeedId = (typeof FEED_IDS)[number];

export type SidePos = "top" | "bottom";
export type SideKey = "left" | "right";
export type SideMode = "single" | "split";

/** A gutter: `top` is always shown; `bottom` is shown only when mode === "split". */
export type SideConfig = { mode: SideMode; top: FeedId; bottom: FeedId };
export type TerminalConfig = { left: SideConfig; right: SideConfig; hidden: boolean };

export const DEFAULT_CONFIG: TerminalConfig = {
  left: { mode: "single", top: "belief-book", bottom: "belief-odds" },
  right: { mode: "split", top: "belief-tape", bottom: "onchain-swaps" },
  hidden: false,
};

export type TerminalAction =
  | { kind: "setFeed"; side: SideKey; pos: SidePos; feed: FeedId }
  | { kind: "toggleSplit"; side: SideKey }
  | { kind: "toggleHidden" };

export function terminalReducer(state: TerminalConfig, action: TerminalConfig | TerminalAction): TerminalConfig {
  // Allow passing a full config (e.g. hydrate from storage) straight through.
  if ("left" in action) return action;
  switch (action.kind) {
    case "setFeed": {
      const side = { ...state[action.side], [action.pos]: action.feed };
      return { ...state, [action.side]: side };
    }
    case "toggleSplit": {
      const cur = state[action.side];
      const side: SideConfig = { ...cur, mode: cur.mode === "split" ? "single" : "split" };
      return { ...state, [action.side]: side };
    }
    case "toggleHidden":
      return { ...state, hidden: !state.hidden };
    default:
      return state;
  }
}

export const STORAGE_KEY = "lynx.terminal.v1";

const isFeedId = (v: unknown): v is FeedId => typeof v === "string" && (FEED_IDS as readonly string[]).includes(v);

function coerceSide(v: unknown, fallback: SideConfig): SideConfig {
  const o = (v ?? {}) as Partial<SideConfig>;
  return {
    mode: o.mode === "split" || o.mode === "single" ? o.mode : fallback.mode,
    top: isFeedId(o.top) ? o.top : fallback.top,
    bottom: isFeedId(o.bottom) ? o.bottom : fallback.bottom,
  };
}

/** Parse persisted JSON into a valid config, repairing/dropping anything unknown (forward-compatible). */
export function parseConfig(raw: string | null | undefined): TerminalConfig {
  if (!raw) return DEFAULT_CONFIG;
  try {
    const o = JSON.parse(raw) as Partial<TerminalConfig>;
    return {
      left: coerceSide(o.left, DEFAULT_CONFIG.left),
      right: coerceSide(o.right, DEFAULT_CONFIG.right),
      hidden: !!o.hidden,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export const serializeConfig = (c: TerminalConfig): string => JSON.stringify(c);

export function loadConfig(): TerminalConfig {
  if (typeof window === "undefined" || !window.localStorage) return DEFAULT_CONFIG;
  return parseConfig(window.localStorage.getItem(STORAGE_KEY));
}

export function saveConfig(c: TerminalConfig): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeConfig(c));
  } catch {
    /* quota / private mode — non-fatal */
  }
}

/** The visible feed ids for a side (1 when single, 2 when split). */
export function visibleFeeds(side: SideConfig): FeedId[] {
  return side.mode === "split" ? [side.top, side.bottom] : [side.top];
}
