import { describe, expect, it } from "vitest";
import { computeConfidence } from "./confidence";

const full = {
  dailyEntrySubmittedToday: true,
  sleepDataAvailable: true,
  hrvAvailable: true,
  restingHrAvailable: true,
  recentPerformanceReadinessAvailable: true,
  recentTrainingDataAvailable: true,
  hasWearable: true,
  consecutiveMissedDays: 0,
};

describe("computeConfidence", () => {
  it("is HIGH when all recommended inputs are present and wearable-connected", () => {
    expect(computeConfidence(full)).toBe("HIGH");
  });

  it("caps a no-wearable client below HIGH even with every other input present (Section 8.4)", () => {
    expect(computeConfidence({ ...full, hasWearable: false })).toBe("MODERATE");
  });

  it("is MODERATE around half of recommended inputs available", () => {
    expect(
      computeConfidence({
        ...full,
        hrvAvailable: false,
        restingHrAvailable: false,
        recentPerformanceReadinessAvailable: false,
      }),
    ).toBe("MODERATE");
  });

  it("is LOW when few inputs are available", () => {
    expect(
      computeConfidence({
        ...full,
        sleepDataAvailable: false,
        hrvAvailable: false,
        restingHrAvailable: false,
        recentPerformanceReadinessAvailable: false,
        recentTrainingDataAvailable: false,
      }),
    ).toBe("LOW");
  });

  it("forces LOW after three or more consecutive missed daily entries (Section 8.5)", () => {
    expect(computeConfidence({ ...full, consecutiveMissedDays: 3 })).toBe("LOW");
  });
});
