"use client";
import { useEffect, useRef, useState } from "react";
import { FEED_CATALOG, FEED_LIST } from "@/lib/live/feeds";
import type { FeedId } from "@/lib/live/terminalConfig";
import { T } from "./styles";

export function FeedSlot({ feedId, onPick, onClose, onAdd }: { feedId: FeedId; onPick: (f: FeedId) => void; onClose: () => void; onAdd?: () => void }) {
  const d = FEED_CATALOG[feedId];
  const Body = d.Component;
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<FeedId | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the custom menu on outside-click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: T.panel, border: `1px solid ${T.border}`, borderRadius: 9, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, height: 38, padding: "0 8px 0 10px", borderBottom: `1px solid ${T.border}`, background: T.panel2, flexShrink: 0 }}>
        {/* Custom on-theme feed switcher — a chip that toggles a styled popover (no native <select> chrome). */}
        <div ref={menuRef} style={{ position: "relative", minWidth: 0 }}>
          <button
            onClick={() => setOpen((o) => !o)}
            title={d.blurb}
            aria-haspopup="listbox"
            aria-expanded={open}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              maxWidth: "100%",
              height: 26,
              padding: "0 10px",
              borderRadius: 7,
              background: open ? T.panel2 : T.panel,
              border: `1px solid ${T.border}`,
              cursor: "pointer",
            }}
          >
            <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 14.5, letterSpacing: "-0.01em", color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {d.label}
            </span>
            <span style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s ease" }}>▾</span>
          </button>
          {open && (
            <div
              role="listbox"
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                minWidth: 150,
                background: T.panel,
                border: `1px solid ${T.border}`,
                borderRadius: 9,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                padding: 5,
                zIndex: 60,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {FEED_LIST.map((f) => {
                const active = f.id === feedId;
                const hot = hover === f.id;
                return (
                  <button
                    key={f.id}
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onPick(f.id);
                      setOpen(false);
                    }}
                    onMouseEnter={() => setHover(f.id)}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: 6,
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      background: active || hot ? T.panel2 : "transparent",
                      color: active ? T.text : T.dim,
                      fontFamily: T.display,
                      fontWeight: 600,
                      fontSize: 13.5,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    <span>{f.label}</span>
                    {active && <span style={{ color: T.asset, fontSize: 10 }}>◆</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          {onAdd && (
            <button
              onClick={onAdd}
              aria-label="Add a feed"
              title="Add a feed below"
              style={{ display: "grid", placeItems: "center", width: 24, height: 24, borderRadius: 6, background: "transparent", border: "none", color: T.faint, fontSize: 18, lineHeight: 1, cursor: "pointer" }}
            >
              +
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close feed"
            title="Close feed"
            style={{ display: "grid", placeItems: "center", width: 24, height: 24, borderRadius: 6, background: "transparent", border: "none", color: T.faint, fontSize: 16, lineHeight: 1, cursor: "pointer" }}
          >
            ×
          </button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <Body />
      </div>
    </div>
  );
}
