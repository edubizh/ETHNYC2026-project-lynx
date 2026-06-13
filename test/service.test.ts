import { describe, it, expect, vi, afterEach } from "vitest";
import * as pm from "@/lib/adapters/polymarket";
import * as us from "@/lib/adapters/uniswap";
import { buildThemeView } from "@/lib/dashboard/service";

afterEach(() => vi.restoreAllMocks());

describe("buildThemeView", () => {
  it("returns legs + a divergence for the AI theme", async () => {
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.72);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(58);
    const view = await buildThemeView("ai", { low: 0, high: 100 });
    expect(view.title).toBe("AI");
    expect(view.beliefProb).toBeCloseTo(0.72, 6);
    expect(view.band).toEqual({ low: 0, high: 100 });
    expect(view.divergence.gapPct).toBeCloseTo(14, 6); // 0.72 vs 0.58
    expect(view.divergence.direction).toBe("belief-higher");
  });

  it("uses the PRIMARY (first) prediction leg's gamma id for the headline odds", async () => {
    const belief = vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.51);
    vi.spyOn(us, "fetchAssetPrice").mockResolvedValue(50);
    await buildThemeView("ai", { low: 0, high: 100 });
    expect(belief).toHaveBeenCalledWith("608368"); // OpenAI-not-IPO PRIMARY leg
  });
});
