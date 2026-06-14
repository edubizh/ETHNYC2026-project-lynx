import Link from "next/link";
import { notFound } from "next/navigation";
import { buildDashboard, type DashboardView } from "@/lib/dashboard/service";
import { getBucketMeta } from "@/lib/mindshare";
import { ArcAccountBar } from "@/components/ArcAccountBar";
import { BuyBox, type BuyLeg } from "@/components/BuyBox";
import { TopBar } from "@/components/TopBar";

export const dynamic = "force-dynamic";

const DISPLAY = "'Inter Tight', system-ui, sans-serif";
const BODY = "'IBM Plex Sans', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const PANEL = { background: "#14161B", border: "1px solid #2A2D34", borderRadius: 10 } as const;

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

/** Small decorative trend sparkline (the design shows one per market card; no axis/values claimed). */
function CardSpark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 110 30" preserveAspectRatio="none" style={{ width: 96, height: 30, display: "block", flexShrink: 0 }}>
      <polyline
        points="0,20 14,21 28,18 42,19 56,17 70,18 84,15 98,16 110,14"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function ThemePage({ params }: { params: { slug: string } }) {
  let view: DashboardView;
  try {
    view = await buildDashboard(params.slug);
  } catch {
    notFound();
  }

  const meta = getBucketMeta(params.slug);
  const h = view.hero;
  const belief = Math.round(h.beliefProb * 100);
  const pct = Math.round(h.assetBandPercentile * 100);
  const gap = Math.round(h.gapPct);
  const beliefX = clampPct(h.beliefProb * 100);
  const assetX = clampPct(h.assetBandPercentile * 100);
  const gapLeft = Math.min(beliefX, assetX);
  const gapW = Math.abs(assetX - beliefX);
  const dirText =
    h.direction === "asset-higher"
      ? "The asset runs hotter than belief."
      : h.direction === "belief-higher"
        ? "Belief runs hotter than the asset."
        : "Belief and the asset are aligned.";
  const dirChip = h.direction === "asset-higher" ? "↑ asset" : h.direction === "belief-higher" ? "↑ belief" : "aligned";

  const predLegs = view.legs.filter((l) => l.kind === "prediction");
  const assetLegs = view.legs.filter((l) => l.kind === "asset");
  const buyLegs: BuyLeg[] = view.legs.map((l) => ({ label: l.label, kind: l.kind, weight: l.weight }));
  const polygonNav = assetLegs.reduce((a, l) => a + (l.priceUsd ?? 0), 0);

  // Headline security (drives the band) → the ANCHOR row, with an honest availability badge.
  const anchor = view.securities.find((s) => s.ticker === h.assetSymbol) ?? view.securities[0];
  const anyFallback =
    h.beliefSource === "fallback" || h.equitySource === "fallback" || view.legs.some((l) => l.beliefSource === "fallback" || l.priceSource === "fallback");

  const fmt = (n?: number) => (n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: n >= 1000 ? 0 : 2 }));

  return (
    <div style={{ minHeight: "100vh", background: "#0A0B0E", color: "#FFFFFF", fontFamily: BODY, WebkitFontSmoothing: "antialiased" }}>
      <TopBar />

      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 28px 110px" }}>
        <Link href="/browse" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#AAB1BC", fontSize: 13.5, textDecoration: "none", marginBottom: 20 }}>
          ← Themes
        </Link>

        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.03em", fontSize: 52, lineHeight: 1, color: "#FFFFFF" }}>{view.title}</h1>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 24,
              padding: "0 10px",
              background: "rgba(232,235,239,0.12)",
              border: "1px solid rgba(232,235,239,0.3)",
              borderRadius: 999,
              fontFamily: MONO,
              fontSize: 11,
              color: "#E8EBEF",
              marginTop: 8,
            }}
          >
            {meta.status}
          </span>
        </div>
        <p style={{ margin: "0 0 22px", maxWidth: 680, fontSize: 15.5, lineHeight: 1.55, color: "#AAB1BC" }}>{meta.thesis}</p>

        {/* Arc NAV bar */}
        <div style={{ marginBottom: 16 }}>
          <ArcAccountBar polygonNav={polygonNav} />
        </div>

        {/* Inline buy (primary, at top) */}
        <BuyBox slug={view.slug} title={view.title} legs={buyLegs} />

        {/* Sentiment Gap meter */}
        <section style={{ ...PANEL, padding: "26px 28px 24px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 34 }}>
            <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 20, color: "#FFFFFF" }}>AI Sentiment Gap</h2>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 28, padding: "0 12px", background: "#1B1E24", border: "1px solid #2A2D34", borderRadius: 8, fontFamily: MONO, fontSize: 13, color: "#AAB1BC", fontFeatureSettings: "'tnum' 1" }}>
              <span style={{ color: "#7A828D" }}>gap</span>
              <span style={{ color: "#FFFFFF" }}>{gap} pts</span>
              <span style={{ color: "#E8EBEF" }}>{dirChip}</span>
            </span>
          </div>

          <p style={{ margin: "-22px 0 26px", maxWidth: 620, fontSize: 13, lineHeight: 1.55, color: "#7A828D" }}>
            Belief markets price <span style={{ color: "#A6B2C2" }}>&ldquo;{h.beliefLabel}&rdquo;</span> at <span style={{ color: "#A6B2C2", fontFamily: MONO }}>{belief}%</span>; {h.assetSymbol} sits at the <span style={{ color: "#E8EBEF", fontFamily: MONO }}>{pct}th</span> percentile of its published analyst band (${fmt(h.band.low)}–${fmt(h.band.high)}). The gap is a divergence signal between crowd belief and analyst valuation — not a probability or trade recommendation.
          </p>

          <div style={{ position: "relative", height: 56, margin: "0 6px" }}>
            {/* track */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 18, height: 8, background: "#1B1E24", border: "1px solid #2A2D34", borderRadius: 999 }}>
              <div style={{ position: "absolute", left: `${gapLeft}%`, width: `${gapW}%`, top: -1, bottom: -1, background: "linear-gradient(90deg,rgba(138,149,166,0.5),rgba(232,235,239,0.5))", borderRadius: 2 }} />
            </div>
            {/* ticks */}
            <div style={{ position: "absolute", left: 0, top: 30, fontFamily: MONO, fontSize: 10, color: "#5C636D" }}>0%</div>
            <div style={{ position: "absolute", right: 0, top: 30, fontFamily: MONO, fontSize: 10, color: "#5C636D" }}>100%</div>
            {/* belief marker (●) */}
            <div style={{ position: "absolute", left: `${beliefX}%`, top: 14, transform: "translateX(-50%)", width: 16, height: 16, borderRadius: "50%", background: "#8A95A6", border: "2px solid #0A0B0E", boxShadow: "0 0 0 1px #8A95A6" }} />
            {/* asset marker (◆) */}
            <div style={{ position: "absolute", left: `${assetX}%`, top: 15, transform: "translateX(-50%) rotate(45deg)", width: 13, height: 13, background: "linear-gradient(135deg,#F2F4F6,#ADB3BC)", border: "2px solid #0A0B0E", boxShadow: "0 0 0 1px #E8EBEF", borderRadius: 2 }} />
          </div>

          {/* legend */}
          <div style={{ display: "flex", gap: 32, marginTop: 14, paddingTop: 18, borderTop: "1px solid #20242A" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#8A95A6", flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 12, color: "#AAB1BC" }}>Belief · the crowd&apos;s odds</span>
                <span style={{ fontFamily: MONO, fontSize: 20, color: "#A6B2C2", fontFeatureSettings: "'tnum' 1", lineHeight: 1 }}>{belief}%</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 11, height: 11, background: "#E8EBEF", transform: "rotate(45deg)", borderRadius: 2, flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 12, color: "#AAB1BC" }}>{h.assetSymbol} · percentile in analyst band</span>
                <span style={{ fontFamily: MONO, fontSize: 20, color: "#E8EBEF", fontFeatureSettings: "'tnum' 1", lineHeight: 1 }}>{pct}th</span>
              </div>
            </div>
          </div>
          <p style={{ margin: "18px 0 0", fontSize: 15, color: "#FFFFFF" }}>{dirText}</p>
        </section>

        {/* Analyst band */}
        <section style={{ ...PANEL, padding: "22px 24px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
            <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 16, color: "#FFFFFF" }}>Analyst Band · {h.assetSymbol}</h2>
            <span style={{ fontFamily: MONO, fontSize: 13, color: "#E8EBEF", fontFeatureSettings: "'tnum' 1" }}>${fmt(h.equityPrice)}</span>
          </div>
          <div style={{ position: "relative", height: 42, marginTop: 14 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 20, height: 8, background: "#1B1E24", border: "1px solid #2A2D34", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${assetX}%`, background: "linear-gradient(90deg,rgba(232,235,239,0.18),rgba(232,235,239,0.5))" }} />
            </div>
            <div style={{ position: "absolute", left: `${assetX}%`, top: 17, transform: "translateX(-50%) rotate(45deg)", width: 13, height: 13, background: "linear-gradient(135deg,#F2F4F6,#ADB3BC)", border: "2px solid #0A0B0E", boxShadow: "0 0 0 1px #E8EBEF", borderRadius: 2 }} />
            <div style={{ position: "absolute", left: `${assetX}%`, top: -4, transform: "translateX(-50%)", fontFamily: MONO, fontSize: 11, color: "#E8EBEF", whiteSpace: "nowrap", fontFeatureSettings: "'tnum' 1" }}>{pct}th pct</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontFamily: MONO, fontSize: 11.5, color: "#AAB1BC", fontFeatureSettings: "'tnum' 1" }}>
            <span><span style={{ color: "#7A828D" }}>bear</span> ${fmt(h.band.low)}</span>
            <span><span style={{ color: "#7A828D" }}>bull</span> ${fmt(h.band.high)}</span>
          </div>
        </section>

        {/* fallback banner */}
        {anyFallback && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(115,124,138,0.08)", border: "1px solid #2A2D34", borderRadius: 10, padding: "13px 16px", marginBottom: 16 }}>
            <span style={{ color: "#7A828D", fontSize: 14 }}>○</span>
            <span style={{ fontSize: 13, color: "#AAB1BC" }}>
              One source is serving a <span style={{ color: "#FFFFFF" }}>cached fallback</span> value — its feed may be delayed. Everything else is live.
            </span>
          </div>
        )}

        {/* Prediction markets + asset leg */}
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 12px", display: "flex", alignItems: "center", gap: 10, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "-0.02em", fontSize: 18, color: "#FFFFFF" }}>
            <span>Prediction markets</span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 400, color: "#7A828D", padding: "2px 8px", border: "1px solid #2A2D34", borderRadius: 999 }}>in basket above</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {predLegs.map((leg, i) => {
              const yes = Math.round((leg.beliefProb ?? 0) * 100);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, padding: "15px 18px", ...PANEL }}>
                  <div style={{ flex: 1.5, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14.5, color: "#FFFFFF" }}>
                      <span style={{ color: "#8A95A6", fontSize: 9 }}>●</span>
                      {leg.label}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 11, color: "#7A828D" }}>
                      {leg.beliefSource === "live" ? (
                        <>
                          <span style={{ color: "#3FBE85" }}>●</span>live · Polymarket
                        </>
                      ) : (
                        <>
                          <span style={{ color: "#7A828D" }}>○</span>fallback · cached
                        </>
                      )}
                    </span>
                  </div>
                  <div style={{ width: 148, display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontFamily: MONO, fontSize: 22, color: "#A6B2C2", fontFeatureSettings: "'tnum' 1", lineHeight: 1 }}>{yes}%</span>
                      <span style={{ fontSize: 10.5, color: "#7A828D" }}>YES</span>
                    </span>
                    <div style={{ height: 6, background: "#1B1E24", border: "1px solid #2A2D34", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${clampPct(yes)}%`, background: "#8A95A6" }} />
                    </div>
                  </div>
                  <CardSpark color="#8A95A6" />
                  <div style={{ width: 60, textAlign: "right", display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end", flexShrink: 0 }}>
                    <span style={{ fontFamily: MONO, fontSize: 15, color: "#FFFFFF", fontFeatureSettings: "'tnum' 1" }}>{Math.round(leg.weight * 100)}%</span>
                    <span style={{ fontSize: 10, color: "#7A828D" }}>weight</span>
                  </div>
                </div>
              );
            })}

            {/* asset sleeve — one card per token */}
            {assetLegs.map((leg, i) => (
              <div key={`asset-${i}`} style={{ display: "flex", alignItems: "center", gap: 20, padding: "15px 18px", ...PANEL }}>
                <div style={{ flex: 1.5, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14.5, color: "#FFFFFF" }}>
                    <span style={{ color: "#E8EBEF", fontSize: 9 }}>◆</span>
                    {leg.label}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 11, color: "#E8EBEF" }}>
                    <span>◆</span>live · uniswap <span style={{ color: "#7A828D" }}>(Polygon)</span>
                  </span>
                </div>
                <div style={{ width: 148, display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 22, color: "#E8EBEF", fontFeatureSettings: "'tnum' 1", lineHeight: 1 }}>${fmt(leg.priceUsd)}</span>
                  <span style={{ fontSize: 10.5, color: "#7A828D", fontFamily: MONO }}>uniswap /quote oracle</span>
                </div>
                <CardSpark color="#E8EBEF" />
                <div style={{ width: 60, textAlign: "right", display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end", flexShrink: 0 }}>
                  <span style={{ fontFamily: MONO, fontSize: 15, color: "#FFFFFF", fontFeatureSettings: "'tnum' 1" }}>{Math.round(leg.weight * 100)}%</span>
                  <span style={{ fontSize: 10, color: "#7A828D" }}>weight</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ANCHOR — related security (honest availability badge) */}
        {anchor && (
          <section style={{ background: "#0E1014", border: "1px solid #20242A", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: "#5C636D", letterSpacing: "0.04em" }}>ANCHOR</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#FFFFFF" }}>
                  <span style={{ color: "#E8EBEF", fontSize: 9 }}>◆</span>{anchor.ticker}
                </span>
                {anchor.priceUsd != null && <span style={{ fontFamily: MONO, fontSize: 13, color: "#FFFFFF", fontFeatureSettings: "'tnum' 1" }}>${fmt(anchor.priceUsd)}</span>}
                {anchor.bandPercentile != null && (
                  <span style={{ fontFamily: MONO, fontSize: 12, color: "#AAB1BC", fontFeatureSettings: "'tnum' 1" }}>{Math.round(anchor.bandPercentile * 100)}th pct of band</span>
                )}
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 11.5, color: anchor.availability === "LIVE-UNISWAP" ? "#E8EBEF" : "#7A828D" }}>
                <span>{anchor.availability === "LIVE-UNISWAP" ? "◆" : "◇"}</span>
                {anchor.availability === "LIVE-UNISWAP" ? "live · uniswap" : "display-only"}
                {anchor.chain && <span style={{ color: "#5C636D" }}>({anchor.chain})</span>}
              </span>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
