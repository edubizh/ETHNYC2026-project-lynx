import { describe, it, expect } from "vitest";
import { getTheme, themeWeightsSumToOne, getSecurities, getHeadlineSecurity, listThemes } from "@/lib/baskets/registry";
import { assetBandPercentile } from "@/lib/divergence/engine";
import { ADDR } from "@/lib/addresses";

describe("basket registry", () => {
  it("returns the AI theme with at least one prediction leg and one asset leg", () => {
    const t = getTheme("ai");
    expect(t.slug).toBe("ai");
    expect(t.legs.some((l) => l.kind === "prediction")).toBe(true);
    expect(t.legs.some((l) => l.kind === "asset")).toBe(true);
  });

  it("weights sum to 1", () => {
    expect(themeWeightsSumToOne("ai")).toBe(true);
  });

  it("throws on an unknown theme", () => {
    expect(() => getTheme("nope")).toThrow(/Unknown theme/);
  });

  it("has no unresolved placeholders and real 0x ids on every prediction leg of every bucket", () => {
    for (const t of listThemes()) {
      for (const leg of t.legs) {
        if (leg.kind !== "prediction") continue;
        expect(leg.gammaMarketId).toMatch(/^\d+$/); // numeric Gamma id, not REPLACE_*
        expect(leg.conditionId).toMatch(/^0x[0-9a-f]{64}$/);
        expect(leg.questionId).toMatch(/^0x[0-9a-f]{64}$/);
        expect(leg.outcomeTokenIds.yes).toMatch(/^\d+$/);
        expect(leg.outcomeTokenIds.no).toMatch(/^\d+$/);
      }
    }
  });
});

describe("all demo buckets", () => {
  const EXPECTED = ["ai", "crypto", "macro", "geopolitics", "us-politics", "sports", "entertainment"];

  it("registry contains the seven demo-ready buckets", () => {
    const slugs = listThemes().map((t) => t.slug);
    for (const s of EXPECTED) expect(slugs).toContain(s);
  });

  it("every bucket has a prediction leg, an asset leg, weights summing to 1, and a headline security", () => {
    for (const t of listThemes()) {
      expect(t.legs.some((l) => l.kind === "prediction")).toBe(true);
      expect(t.legs.some((l) => l.kind === "asset")).toBe(true);
      expect(themeWeightsSumToOne(t.slug)).toBe(true);
      expect(() => getHeadlineSecurity(t.slug)).not.toThrow();
    }
  });
});

describe("bucket securities (display/anchor model)", () => {
  const AVAILABILITY = ["LIVE-UNISWAP", "DISPLAY-ONLY"];

  it("every theme exposes ≥1 security, each with a ticker and a valid availability tag", () => {
    for (const t of listThemes()) {
      const secs = getSecurities(t.slug);
      expect(secs.length).toBeGreaterThan(0);
      for (const s of secs) {
        expect(s.ticker).toBeTruthy();
        expect(AVAILABILITY).toContain(s.availability);
      }
    }
  });

  it("the AI headline security is NVDA and display-only (NVDA is not Uniswap-tradeable)", () => {
    const h = getHeadlineSecurity("ai");
    expect(h.ticker).toBe("NVDA");
    expect(h.availability).not.toBe("LIVE-UNISWAP");
    expect(h.analystBand).toBeDefined();
    expect(h.analystBand!.high).toBeGreaterThan(h.analystBand!.low);
  });

  it("the AI analyst band places NVDA's seed price mid-band (not pinned at an extreme)", () => {
    const t = getTheme("ai");
    const h = getHeadlineSecurity("ai");
    const pct = assetBandPercentile(t.display.fallback.equityPrice, h.analystBand!.low, h.analystBand!.high);
    expect(pct).toBeGreaterThan(0.2);
    expect(pct).toBeLessThan(0.8);
  });

  // Invariant lock (A2): guard the *display* path directly — display.analystBand + display.fallback —
  // so the offline hero percentile can never saturate. (test 76-82 covers the headline-security path.)
  it("AI fallback seed price sits strictly inside the fallback band (never saturates the hero)", () => {
    const ai = getTheme("ai");
    const { low, high } = ai.display.analystBand;
    const seed = ai.display.fallback.equityPrice;
    expect(seed).toBeGreaterThan(low);
    expect(seed).toBeLessThan(high);
    // and not pinned to an edge: at least 15% in from either bound
    const pct = (seed - low) / (high - low);
    expect(pct).toBeGreaterThan(0.15);
    expect(pct).toBeLessThan(0.85);
  });
});

describe("multi-asset on-chain sleeve", () => {
  it("every bucket has ≥1 asset leg, each with a token, a v3 swapFee, and a ticker", () => {
    for (const t of listThemes()) {
      const assets = t.legs.filter((l) => l.kind === "asset") as Array<{ token: string; swapFee?: number; ticker?: string }>;
      expect(assets.length).toBeGreaterThanOrEqual(1);
      for (const a of assets) {
        expect(a.token).toMatch(/^0x[0-9a-fA-F]{40}$/);
        expect([500, 3000, 10000]).toContain(a.swapFee);
        expect(a.ticker).toBeTruthy();
      }
    }
  });

  it("weights still sum to 1 across predictions + the sleeve", () => {
    for (const t of listThemes()) expect(themeWeightsSumToOne(t.slug)).toBe(true);
  });

  // Anti-drift, ONE direction only: every bought asset leg must be a displayed LIVE-UNISWAP security.
  // The reverse does NOT hold by design — e.g. wstETH is a LIVE-UNISWAP display security (priced via
  // /quote) but NOT a sleeve leg, because its direct USDC.e pool is empty (Task 0).
  it("asset legs are a subset of the bucket's LIVE-UNISWAP securities", () => {
    for (const t of listThemes()) {
      const secTokens = new Set(
        getSecurities(t.slug).filter((s) => s.availability === "LIVE-UNISWAP" && s.token).map((s) => s.token!.toLowerCase()),
      );
      for (const a of t.legs.filter((l) => l.kind === "asset")) {
        expect(secTokens.has((a as { token: string }).token.toLowerCase())).toBe(true);
      }
    }
  });

  it("AI sleeve is WETH + LINK (risk-on / data-infra), NVDA stays display-only", () => {
    const tickers = getTheme("ai").legs.filter((l) => l.kind === "asset").map((l) => (l as { ticker: string }).ticker);
    expect(tickers).toEqual(["WETH", "LINK"]);
  });
});

describe("multi-asset analyst graph data", () => {
  it("every bucket exposes ≥3 securities with a valid analyst band (a real multi-name graph)", () => {
    for (const t of listThemes()) {
      const banded = getSecurities(t.slug).filter((s) => s.analystBand);
      expect(banded.length, `${t.slug} has only ${banded.length} banded securities`).toBeGreaterThanOrEqual(3);
      for (const s of banded) expect(s.analystBand!.high).toBeGreaterThan(s.analystBand!.low);
    }
  });

  it("every non-headline graph security carries a seed price strictly inside its band (renders offline)", () => {
    for (const t of listThemes()) {
      const headline = t.display.assetSymbol;
      const banded = getSecurities(t.slug).filter((s) => s.analystBand && s.ticker !== headline);
      for (const s of banded) {
        expect(s.priceUsd, `${t.slug}/${s.ticker} needs a seed priceUsd`).toBeDefined();
        const { low, high } = s.analystBand!;
        expect(s.priceUsd! > low && s.priceUsd! < high, `${t.slug}/${s.ticker} seed ${s.priceUsd} outside [${low},${high}]`).toBe(true);
      }
    }
  });

  it("every bucket's display fallback seed sits strictly inside its display band (offline hero never saturates)", () => {
    for (const t of listThemes()) {
      const { low, high } = t.display.analystBand;
      const seed = t.display.fallback.equityPrice;
      expect(seed > low && seed < high, `${t.slug} seed ${seed} not inside [${low},${high}]`).toBe(true);
    }
  });
});
