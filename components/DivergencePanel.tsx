import type { DashboardView } from "@/lib/dashboard/service";

// The hero screen. NEVER labels the band percentile an "implied probability".
export function DivergencePanel({ hero }: { hero: DashboardView["hero"] }) {
  const belief = Math.round(hero.beliefProb * 100);
  const pct = Math.round(hero.assetBandPercentile * 100);
  const dir =
    hero.direction === "belief-higher"
      ? "belief runs hotter than the asset"
      : hero.direction === "asset-higher"
        ? "the asset runs hotter than belief"
        : "belief and asset are aligned";
  return (
    <div className="panel">
      <h2>AI Sentiment Gap</h2>
      <div className="hero-gap">
        <span className="belief">{belief}%</span> belief &nbsp;·&nbsp; <span className="asset">{pct}th</span> pct
      </div>
      <p className="subtle">
        Belief markets price the event at <b>{belief}%</b>; {hero.assetSymbol} sits at the{" "}
        <b>{pct}th percentile</b> of its published analyst bear→bull band — a <b>{hero.gapPct.toFixed(0)}-point gap</b>{" "}
        ({dir}).
      </p>
      <div className="row">
        <div className="stat">
          <div className="k">
            Belief odds <span className={`pill ${hero.beliefSource}`}>{hero.beliefSource}</span>
          </div>
          <div className="v belief">{belief}%</div>
        </div>
        <div className="stat">
          <div className="k">
            {hero.assetSymbol} band pct <span className={`pill ${hero.equitySource}`}>{hero.equitySource}</span>
          </div>
          <div className="v asset">{pct}th</div>
        </div>
        <div className="stat">
          <div className="k">AI Sentiment Gap</div>
          <div className="v">{hero.gapPct.toFixed(0)} pts</div>
        </div>
      </div>
    </div>
  );
}
