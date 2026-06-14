import type { ReactNode } from "react";
import { getTheme } from "@/lib/baskets/registry";
import type { AssetLeg, PredictionLeg } from "@/lib/baskets/types";
import type { FeedContext } from "@/lib/live/types";
import { Terminal } from "@/components/terminal/Terminal";

// Wraps the (untouched) dashboard page and mounts the customizable live terminal in the side gutters.
// Reads the registry server-side to build the feed context; renders nothing extra for unknown themes.
export default function ThemeLayout({ children, params }: { children: ReactNode; params: { slug: string } }) {
  let feedContext: FeedContext | null = null;
  try {
    const t = getTheme(params.slug);
    const pred = t.legs.find((l): l is PredictionLeg => l.kind === "prediction");
    const assets = t.legs.filter((l): l is AssetLeg => l.kind === "asset");
    if (pred) {
      feedContext = {
        slug: t.slug,
        title: t.title,
        marketLabel: pred.label,
        conditionId: pred.conditionId,
        yesId: pred.outcomeTokenIds.yes,
        noId: pred.outcomeTokenIds.no,
        assets: assets.map((a) => ({ ticker: a.ticker, token: a.token, decimals: a.decimals })),
        equityTicker: t.display.assetSymbol,
      };
    }
  } catch {
    /* unknown theme — render the page without the terminal */
  }

  return (
    <>
      {children}
      {feedContext && <Terminal feedContext={feedContext} />}
    </>
  );
}
