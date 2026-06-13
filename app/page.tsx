import Link from "next/link";
import { listThemes } from "@/lib/baskets/registry";

export default function Home() {
  const themes = listThemes();
  return (
    <main>
      <div className="brandbar">
        <h1>◧ Project-Lynx</h1>
        <span className="tag">non-custodial thematic prediction-market index · ETHGlobal NY 2026</span>
      </div>
      <p className="subtle">
        Browse a theme to see its <b>AI Sentiment Gap</b> — belief-market odds vs. where the AI-correlated
        asset sits in its published analyst bear/bull band — then enter the curated basket in one signature.
        Positions land in your own wallet. We never custody funds and never create markets.
      </p>

      {themes.map((t) => (
        <Link key={t.slug} href={`/theme/${t.slug}`} className="panel themecard">
          <h2>{t.title} theme</h2>
          <div className="subtle">
            {t.legs.filter((l) => l.kind === "prediction").length} prediction legs +{" "}
            {t.legs.filter((l) => l.kind === "asset").length} on-chain asset leg · hero asset {t.display.assetSymbol}
          </div>
        </Link>
      ))}
    </main>
  );
}
