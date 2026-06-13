import type { Theme, Security } from "./types";

// Illustrative published analyst bear/bull band for NVDA, shared by display.analystBand and the NVDA
// security so they never drift. Widened from the stale {100,210} (which pinned a live ~$200 price at the
// top and produced a misleading ~45-pt gap) so the price now sits mid-band. Refresh/source over time.
const AI_BAND: { low: number; high: number } = { low: 105, high: 305 };

// conditionIds, questionIds, outcomeTokenIds, seedBeliefProb and the asset token are all VERIFIED
// on-chain / via Gamma (2026-06-13). The OpenAI-not-IPO leg (ends 2027-01-01) is the PRIMARY
// always-valid leg and drives the headline odds; the Anthropic leg (ends 2026-06-30) is the
// secondary/vivid demo leg.
const THEMES: Record<string, Theme> = {
  ai: {
    slug: "ai",
    title: "AI",
    legs: [
      // PRIMARY / always-valid prediction leg (~51% YES).
      {
        kind: "prediction",
        label: "OpenAI does NOT IPO by Dec 2026",
        gammaMarketId: "608368",
        conditionId: "0x3849e1d62e0807801913d3e2427e8caf3cc6dd1c8ef42d8d5c08c6f9c449dc5e",
        questionId: "0xd2c21cbb9d2cb407ab3dcf619d93f6d65b7967154cd6ee930f7758baa2b4bf06",
        outcomeTokenIds: {
          yes: "56615676606297588259337956203332341775475048285080710344367729433788967812170",
          no: "8070607953656787024050950499598687532281829563384949938603247089607814583142",
        },
        seedBeliefProb: 0.51,
        weight: 0.35,
      },
      // SECONDARY / vivid prediction leg (~89.5% YES) — great demo number, may resolve sooner.
      {
        kind: "prediction",
        label: "Anthropic has the top AI model",
        gammaMarketId: "631121",
        conditionId: "0x0811ed7f71c2466d04f9ba801c0e21c9cfb016385cdff97b5c9984df0fa5801e",
        questionId: "0x3dcd0f5c7c6df89336a87be866327c862646e18b5deee05f31c250451b3a2901",
        outcomeTokenIds: {
          yes: "64887172491629329116501561142670952112197574356607923997934182163296576951634",
          no: "12813183214224132107278873250345740614275647031034326420266129033763649478747",
        },
        seedBeliefProb: 0.895,
        weight: 0.15,
      },
      // NVDA is display-only (equities API); the executable on-chain asset leg is wstETH via Sushi.
      {
        kind: "asset",
        label: "NVDA-correlated asset leg (wstETH via Sushi)",
        token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD",
        weight: 0.5,
      },
    ],
    display: {
      assetSymbol: "NVDA",
      analystBand: AI_BAND,
      // Seed values for the offline/no-key demo.
      fallback: { beliefProb: 0.51, equityPrice: 165, assetLegPriceUsd: 4300 },
      // Thematically-related securities — display/anchor only. NVDA is not Uniswap-tradeable for a
      // US/ungated user (xStocks NVDAx live on Solana, US-gated), so it renders an honest badge, not a buy.
      securities: [
        {
          ticker: "NVDA",
          name: "NVIDIA",
          analystBand: AI_BAND,
          availability: "TOKENIZED-BUT-GATED",
          chain: "solana",
          note: "xStocks (NVDAx) trade on Solana; US-gated — display-only here.",
        },
      ],
    },
  },
};

export function getTheme(slug: string): Theme {
  const t = THEMES[slug];
  if (!t) throw new Error(`Unknown theme: ${slug}`);
  return t;
}

export function listThemes(): Theme[] {
  return Object.values(THEMES);
}

export function themeWeightsSumToOne(slug: string): boolean {
  const sum = getTheme(slug).legs.reduce((a, l) => a + l.weight, 0);
  return Math.abs(sum - 1) < 1e-9;
}

/** The thematically-related securities shown inside a bucket (display/anchor layer). */
export function getSecurities(slug: string): Security[] {
  return getTheme(slug).display.securities;
}

/** The headline security (the one whose analyst band drives the hero gap) — matched by `assetSymbol`. */
export function getHeadlineSecurity(slug: string): Security {
  const t = getTheme(slug);
  const sec = t.display.securities.find((s) => s.ticker === t.display.assetSymbol);
  if (!sec) throw new Error(`No headline security (${t.display.assetSymbol}) in theme: ${slug}`);
  return sec;
}
