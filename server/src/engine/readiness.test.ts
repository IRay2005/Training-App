import { describe, expect, it } from "vitest";
import { computeReadiness } from "./readiness";

describe("computeReadiness", () => {
  it("scores a strong all-round day as Green under high confidence", () => {
    const result = computeReadiness({
      components: { wellness: 90, sleep: 85, hrv: 80, restingHr: 85, performance: 80 },
      pain: { hasPain: false },
      confidenceTier: "HIGH",
    });
    expect(result.color).toBe("GREEN");
    expect(result.overrideActive).toBe(false);
  });

  it("cannot show Green when the self-reported wellness block is missing (Section 9.1)", () => {
    const result = computeReadiness({
      components: { sleep: 95, hrv: 95, restingHr: 95 },
      pain: { hasPain: false },
      confidenceTier: "HIGH",
    });
    expect(result.color).not.toBe("GREEN");
  });

  it("high pain severity forces Red regardless of the underlying score (Section 10)", () => {
    const result = computeReadiness({
      components: { wellness: 95, sleep: 95, hrv: 95, restingHr: 95, performance: 95 },
      pain: { hasPain: true, painSeverity: 8 },
      confidenceTier: "HIGH",
    });
    expect(result.color).toBe("RED");
    expect(result.overrideActive).toBe(true);
  });

  it("mild pain blocks Green but does not force Red", () => {
    const result = computeReadiness({
      components: { wellness: 95, sleep: 95, hrv: 95, restingHr: 95, performance: 95 },
      pain: { hasPain: true, painSeverity: 2 },
      confidenceTier: "HIGH",
    });
    expect(result.color).toBe("AMBER");
  });

  it("bounds low-confidence readings away from the extremes (Section 9.1)", () => {
    const result = computeReadiness({
      components: { wellness: 100, sleep: 100 },
      pain: { hasPain: false },
      confidenceTier: "LOW",
    });
    expect(result.score).toBeLessThanOrEqual(70);
  });

  it("applies a missing-data color cap regardless of the computed score (Section 8.5)", () => {
    const result = computeReadiness({
      components: { wellness: 95, sleep: 95, hrv: 95, restingHr: 95, performance: 95 },
      pain: { hasPain: false },
      confidenceTier: "HIGH",
      colorCap: "AMBER",
    });
    expect(result.color).toBe("AMBER");
  });
});
