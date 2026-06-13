import { describe, it, expect } from "vitest";
import { getTheme, themeWeightsSumToOne, getSecurities, getHeadlineSecurity, listThemes } from "@/lib/baskets/registry";
import { assetBandPercentile } from "@/lib/divergence/engine";

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

  it("has no unresolved placeholders and real 0x ids on every prediction leg", () => {
    const t = getTheme("ai");
    for (const leg of t.legs) {
      if (leg.kind !== "prediction") continue;
      expect(leg.gammaMarketId).toMatch(/^\d+$/); // numeric Gamma id, not REPLACE_*
      expect(leg.conditionId).toMatch(/^0x[0-9a-f]{64}$/);
      expect(leg.questionId).toMatch(/^0x[0-9a-f]{64}$/);
      expect(leg.outcomeTokenIds.yes).toMatch(/^\d+$/);
      expect(leg.outcomeTokenIds.no).toMatch(/^\d+$/);
    }
  });
});

describe("bucket securities (display/anchor model)", () => {
  const AVAILABILITY = ["LIVE-UNISWAP", "TOKENIZED-BUT-GATED", "NO-TOKENIZED-VERSION"];

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
});
