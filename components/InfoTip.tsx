"use client";

import { useState, type ReactNode } from "react";

const MONO = "'IBM Plex Mono', monospace";
const BODY = "'IBM Plex Sans', system-ui, sans-serif";

/** A small "i" info badge with a hover/focus popover. Pure client component; the tooltip sits above and is
 *  shown on mouse-enter or keyboard focus and hidden on leave/blur. Keep the passed content short. */
export function InfoTip({ children, ariaLabel = "How this is calculated", width = 270 }: { children: ReactNode; ariaLabel?: string; width?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 14,
          height: 14,
          borderRadius: "50%",
          cursor: "help",
          border: "1px solid #3A3F47",
          color: "#7A828D",
          background: "#1B1E24",
          fontFamily: MONO,
          fontSize: 9.5,
          fontStyle: "italic",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        i
      </span>
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            width,
            zIndex: 30,
            padding: "11px 13px",
            background: "#0E1014",
            border: "1px solid #2A2D34",
            borderRadius: 9,
            boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
            fontFamily: BODY,
            fontSize: 11.5,
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 0,
            textTransform: "none",
            whiteSpace: "normal",
            color: "#AAB1BC",
          }}
        >
          {children}
        </span>
      )}
    </span>
  );
}
