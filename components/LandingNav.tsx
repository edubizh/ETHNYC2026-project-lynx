import Link from "next/link";

const DISPLAY = "'Inter Tight', system-ui, sans-serif";
const BODY = "'IBM Plex Sans', system-ui, sans-serif";

// Placeholder marketing links — real destinations / auth wired in later.
const LINKS = [
  { label: "Overview", href: "#" },
  { label: "Methodology", href: "#" },
  { label: "Docs", href: "#" },
];

export function LandingNav() {
  return (
    <header style={{ height: 80, display: "flex", alignItems: "center", padding: "0 24px" }}>
      {/* Centered max-width row so the wordmark + nav aren't pinned to the screen corners on wide displays. */}
      <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", flexShrink: 0 }}>
          <span style={{ position: "relative", width: 24, height: 24, display: "inline-grid", placeItems: "center" }}>
            <span style={{ width: 14, height: 14, background: "linear-gradient(135deg,#F2F4F6,#ADB3BC)", transform: "rotate(45deg)", borderRadius: 2 }} />
            <span style={{ position: "absolute", width: 24, height: 24, border: "1px solid rgba(232,235,239,0.35)", transform: "rotate(45deg)", borderRadius: 5 }} />
          </span>
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.16em", fontSize: 18, color: "#fff", whiteSpace: "nowrap" }}>
            LYNX
          </span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 34 }}>
          <span className="nav-extra" style={{ display: "flex", alignItems: "center", gap: 30 }}>
            {LINKS.map((l) => (
              <a key={l.label} href={l.href} className="nav-link" style={{ fontFamily: BODY, fontSize: 14, color: "#AAB1BC", textDecoration: "none" }}>
                {l.label}
              </a>
            ))}
          </span>
          <Link
            href="/browse"
            className="launch-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 22px",
              background: "linear-gradient(180deg,#F4F6F8,#C4C9D1)",
              color: "#0A0B0E",
              borderRadius: 9,
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "-0.01em",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Launch app
            <span style={{ fontSize: 13 }}>→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
