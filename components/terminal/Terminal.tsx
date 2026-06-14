"use client";
import { useEffect, useReducer, useState, type CSSProperties } from "react";
import { DEFAULT_CONFIG, loadConfig, saveConfig, terminalReducer, type SideKey } from "@/lib/live/terminalConfig";
import type { FeedContext } from "@/lib/live/types";
import { TerminalDataProvider } from "./TerminalData";
import { SideRail } from "./SideRail";

// Rails fill each gutter and line up just outside the centered 1040px dashboard column.
const DASH = 1040;
const RAIL_WIDTH = `clamp(170px, calc((100vw - ${DASH}px) / 2 - 30px), 400px)`;
const MIN_WIDE = 1420;

function railStyle(side: SideKey): CSSProperties {
  return {
    position: "fixed",
    top: 78,
    bottom: 16,
    [side]: 16,
    width: RAIL_WIDTH,
    zIndex: 30,
    pointerEvents: "auto",
  } as CSSProperties;
}

// Tape flash-in for new rows + the live status-dot pulse (referenced by feeds/parts.tsx).
const KEYFRAMES = `
@keyframes lynxTapeIn{0%{opacity:0;transform:translateY(-6px);background:rgba(232,235,239,0.10);}60%{background:rgba(232,235,239,0.04);}100%{opacity:1;transform:none;background:transparent;}}
@keyframes lynxLive{0%,100%{opacity:1;}50%{opacity:0.35;}}
`;

export function Terminal({ feedContext }: { feedContext: FeedContext }) {
  const [config, dispatch] = useReducer(terminalReducer, DEFAULT_CONFIG);
  const [wide, setWide] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (server renders DEFAULT_CONFIG → no hydration mismatch).
  useEffect(() => {
    dispatch(loadConfig());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveConfig(config);
  }, [config, hydrated]);

  // Only show when there's room in the gutters; otherwise the centered dashboard is untouched.
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MIN_WIDE}px)`);
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!wide) return null;

  return (
    <TerminalDataProvider ctx={feedContext}>
      <style>{KEYFRAMES}</style>
      <aside style={railStyle("left")}>
        <SideRail side="left" config={config.left} dispatch={dispatch} />
      </aside>
      <aside style={railStyle("right")}>
        <SideRail side="right" config={config.right} dispatch={dispatch} />
      </aside>
    </TerminalDataProvider>
  );
}
