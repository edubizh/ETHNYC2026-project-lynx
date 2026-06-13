import Link from "next/link";
import { notFound } from "next/navigation";
import { buildDashboard } from "@/lib/dashboard/service";
import { DivergencePanel } from "@/components/DivergencePanel";
import { AnalystBand } from "@/components/AnalystBand";
import { BasketTable } from "@/components/BasketTable";
import { EnterButton } from "@/components/EnterButton";
import { AccountBar } from "@/components/AccountBar";

// Live Gamma odds are fetched per request; never statically prerendered.
export const dynamic = "force-dynamic";

export default async function ThemePage({ params }: { params: { slug: string } }) {
  let view;
  try {
    view = await buildDashboard(params.slug);
  } catch {
    notFound();
  }

  // Illustrative unified NAV contribution from the Polygon legs (the on-chain asset leg's USD value).
  const polygonNav = view.legs.reduce((a, l) => a + (l.kind === "asset" ? (l.priceUsd ?? 0) : 0), 0);

  return (
    <main>
      <div className="brandbar">
        <h1>◧ {view.title} basket</h1>
        <span className="tag">
          <Link href="/">← themes</Link>
        </span>
      </div>

      <AccountBar polygonNav={polygonNav} />
      <DivergencePanel hero={view.hero} />
      <AnalystBand hero={view.hero} />
      <BasketTable legs={view.legs} />

      <div className="panel">
        <h2>Enter the basket — one signature</h2>
        <p className="subtle">
          LI.FI Composer bundles swap → bridge (from Ethereum / Base) → <code>EnterBasket</code> on Polygon: a real
          Polymarket NegRisk <b>neutral YES+NO set</b> (USDC.e collateral) + the on-chain asset leg, delivered into
          your own wallet. The neutral set is full thematic exposure; the &ldquo;sell to go directional&rdquo; CTA lets
          you pick a side afterward.
        </p>
        <EnterButton slug={view.slug} />
      </div>
    </main>
  );
}
