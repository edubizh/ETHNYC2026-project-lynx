import { describe, it, expect } from "vitest";
import { getTheme, themeWeightsSumToOne } from "@/lib/baskets/registry";

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
