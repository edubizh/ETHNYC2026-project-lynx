"use client";
import { useEffect, useReducer, useState, type CSSProperties } from "react";
import { DEFAULT_CONFIG, loadConfig, saveConfig, terminalReducer, type SideKey } from "@/lib/live/terminalConfig";
import type { FeedContext } from "@/lib/live/types";
import { TerminalDataProvider } from "./TerminalData";
import { SideRail } from "./SideRail";
import { T } from "./styles";

const RAIL_WIDTH = "clamp(150px, calc((100vw - 1080px) / 2), 240px)";
const MIN_WIDE = 1360;

function railStyle(side: SideKey): CSSProperties {
  return {
    position: "fixed",
    top: 72,
    bottom: 14,
    [side]: 10,
    width: RAIL_WIDTH,
    zIndex: 30,
    pointerEvents: "auto",
  } as CSSProperties;
}

const toggleBtn: CSSProperties = {
  background: T.panel,
  border: `1px solid ${T.border}`,
  borderRadius: 7,
  color: T.dim,
  fontFamily: T.mono,
  fontSize: 10,
  letterSpacing: 0.5,
  padding: "5px 9px",
  cursor: "pointer",
};

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

  const toggle = (
    <button onClick={() => dispatch({ kind: "toggleHidden" })} style={toggleBtn} title="Show/hide the live terminal">
      {config.hidden ? "⊞ terminal" : "⊠ hide"}
    </button>
  );

  if (config.hidden) {
    return <div style={{ position: "fixed", right: 14, bottom: 14, zIndex: 40 }}>{toggle}</div>;
  }

  return (
    <TerminalDataProvider ctx={feedContext}>
      <aside style={railStyle("left")}>
        <SideRail side="left" config={config.left} dispatch={dispatch} />
      </aside>
      <aside style={railStyle("right")}>
        <SideRail side="right" config={config.right} dispatch={dispatch} />
      </aside>
      <div style={{ position: "fixed", right: 14, bottom: 14, zIndex: 40 }}>{toggle}</div>
    </TerminalDataProvider>
  );
}
