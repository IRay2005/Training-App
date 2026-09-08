import { describe, expect, it } from "vitest";
import { evaluateDailyEntryStatus, evaluatePainStatus } from "./missingData";

describe("evaluateDailyEntryStatus", () => {
  it("generates a normal reading when the entry was submitted", () => {
    const effect = evaluateDailyEntryStatus({
      entrySubmittedToday: true,
      hasWearable: true,
      consecutiveMissedDays: 0,
    });
    expect(effect.generateNewReading).toBe(true);
    expect(effect.colorCap).toBeUndefined();
  });

  it("caps at Amber and generates from wearable alone when entry skipped but wearable present", () => {
    const effect = evaluateDailyEntryStatus({
      entrySubmittedToday: false,
      hasWearable: true,
      consecutiveMissedDays: 1,
    });
    expect(effect.generateNewReading).toBe(true);
    expect(effect.colorCap).toBe("AMBER");
  });

  it("does not generate a new reading when entry skipped and no wearable (Section 8.5)", () => {
    const effect = evaluateDailyEntryStatus({
      entrySubmittedToday: false,
      hasWearable: false,
      consecutiveMissedDays: 1,
    });
    expect(effect.generateNewReading).toBe(false);
    expect(effect.flagCoach).toBe(true);
  });

  it("flags the coach after three or more consecutive missed entries", () => {
    const effect = evaluateDailyEntryStatus({
      entrySubmittedToday: true,
      hasWearable: true,
      consecutiveMissedDays: 3,
    });
    expect(effect.flagCoach).toBe(true);
  });
});

describe("evaluatePainStatus", () => {
  it("treats an unanswered pain question as unknown, not as no pain", () => {
    const status = evaluatePainStatus(false);
    expect(status.painKnown).toBe(false);
    expect(status.confidenceNudgeDown).toBe(true);
  });
});
