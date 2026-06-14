// Shared shapes for the terminal feeds. Built server-side in app/theme/[slug]/layout.tsx and
// handed to the client <Terminal> so every feed knows which markets/tokens to subscribe to.

export type AssetRef = { ticker: string; token: string; decimals?: number };

export type FeedContext = {
  slug: string;
  title: string;
  /** Primary belief market (drives the Polymarket WS feeds). */
  marketLabel: string;
  conditionId: string;
  yesId: string; // clobTokenId for YES
  noId: string; // clobTokenId for NO
  /** Buyable basket asset legs (drive the on-chain + price feeds). */
  assets: AssetRef[];
  /** Headline equity ticker (for the Finnhub equity-tape stretch feed). */
  equityTicker: string;
};
