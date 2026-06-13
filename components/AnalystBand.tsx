import type { DashboardView } from "@/lib/dashboard/service";

// Draws the published analyst bear→bull band with a marker at the live asset price (the band IS shown).
export function AnalystBand({ hero }: { hero: DashboardView["hero"] }) {
  const { band, equityPrice, assetSymbol } = hero;
  const left = Math.min(100, Math.max(0, ((equityPrice - band.low) / (band.high - band.low)) * 100));
  return (
    <div className="panel">
      <h2>{assetSymbol} published analyst band</h2>
      <div className="band">
        <div className="marker" style={{ left: `${left}%` }} title={`${assetSymbol} $${equityPrice}`} />
      </div>
      <div className="band-labels">
        <span>bear ${band.low}</span>
        <span>
          {assetSymbol} ${equityPrice}
        </span>
        <span>bull ${band.high}</span>
      </div>
    </div>
  );
}
