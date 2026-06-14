import { describe, it, expect, vi, afterEach } from "vitest";
import * as pm from "@/lib/adapters/polymarket";
import * as eq from "@/lib/adapters/equities";
import { buildMindshareWindows } from "@/lib/mindshare-live";
import { WINDOWS } from "@/lib/mindshare";

afterEach(() => vi.restoreAllMocks());

const AI_LEGS = ["608368", "631121"]; // OpenAI-not-IPO + Anthropic — the AI bucket's prediction legs

describe("buildMindshareWindows", () => {
  it("sizes every window's tiles from live per-window Gamma volume across all 7 buckets", async () => {
    // AI legs get 100× the volume of every other bucket's legs -> AI is the flagship in every window.
    vi.spyOn(pm, "fetchMarketVolumes").mockImplementation(async (id) =>
      AI_LEGS.includes(id)
        ? { "24h": 1000, "7d": 1000, "30d": 1000, "3m": 1000 }
        : { "24h": 10, "7d": 10, "30d": 10, "3m": 10 },
    );
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.5);
    vi.spyOn(eq, "fetchEquityQuote").mockResolvedValue({ price: 165, changePct: 1.2 });

    const w = await buildMindshareWindows();

    for (const win of WINDOWS) {
      expect(w[win].ranked.length).toBe(7);
      expect(w[win].ranked[0].slug).toBe("ai"); // biggest volume in every window
      expect(w[win].others.mindshare).toBeGreaterThan(0);
      expect(w[win].source).toBe("live");
    }
    const ai = w["24h"].ranked[0];
    expect(ai.ms.mindshare).toBeGreaterThan(w["24h"].ranked[1].ms.mindshare);
    expect(ai.ms.change).toBeCloseTo(1.2, 6); // from the equity daily %change (dp)
    // idx = composeIdx(NVDA band-percentile, 0.5 belief) — NVDA 165 in band [105,305] -> 0.30 -> ~38.7
    expect(ai.ms.idx).toBeCloseTo(38.7, 1);
  });

  it("survives one dead prediction leg without nuking the bucket (other legs still count)", async () => {
    vi.spyOn(pm, "fetchMarketVolumes").mockImplementation(async (id) => {
      if (id === "631121") throw new Error("one leg down"); // Anthropic leg fails
      return { "24h": 500, "7d": 500, "30d": 500, "3m": 500 };
    });
    vi.spyOn(pm, "fetchBeliefProb").mockResolvedValue(0.5);
    vi.spyOn(eq, "fetchEquityQuote").mockResolvedValue({ price: 165, changePct: 0 });

    const w = await buildMindshareWindows();
    expect(w["24h"].source).toBe("live");
    expect(w["24h"].ranked.find((r) => r.slug === "ai")!.ms.mindshare).toBeGreaterThan(0);
  });

  it("falls back to verified SEEDS for a window when no live volume is available (feeds down)", async () => {
    vi.spyOn(pm, "fetchMarketVolumes").mockRejectedValue(new Error("gamma down"));
    vi.spyOn(pm, "fetchBeliefProb").mockRejectedValue(new Error("down"));
    vi.spyOn(eq, "fetchEquityQuote").mockRejectedValue(new Error("no key"));

    const w = await buildMindshareWindows();
    for (const win of WINDOWS) {
      expect(w[win].ranked.length).toBe(7);
      expect(w[win].ranked[0].slug).toBe("ai");
      expect(w[win].source).toBe("fallback");
    }
    expect(w["24h"].ranked[0].ms.mindshare).toBeCloseTo(34.2, 6); // verified AI seed
  });
});
