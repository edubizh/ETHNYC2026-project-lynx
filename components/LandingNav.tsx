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
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        height: 64,
        padding: "0 28px",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", flexShrink: 0 }}>
        <span style={{ position: "relative", width: 22, height: 22, display: "inline-grid", placeItems: "center" }}>
          <span style={{ width: 13, height: 13, background: "linear-gradient(135deg,#F2F4F6,#ADB3BC)", transform: "rotate(45deg)", borderRadius: 2 }} />
          <span style={{ position: "absolute", width: 22, height: 22, border: "1px solid rgba(232,235,239,0.35)", transform: "rotate(45deg)", borderRadius: 4 }} />
        </span>
        <span style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 15, color: "#fff", whiteSpace: "nowrap" }}>
          Traditional Predictions
        </span>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <span className="nav-extra" style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="nav-link" style={{ fontFamily: BODY, fontSize: 13.5, color: "#9aa3b2", textDecoration: "none" }}>
              {l.label}
            </a>
          ))}
        </span>
        <Link href="/browse" className="nav-link" style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 13.5, color: "#E8EBEF", textDecoration: "none", whiteSpace: "nowrap" }}>
          Launch app →
        </Link>
      </nav>
    </header>
  );
}
