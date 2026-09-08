import type { ConfidenceTier, ReadinessColor } from "@ats/shared";

// Section 8.5: the specific fallback table for missing daily-entry data.
// The guiding principle throughout the spec: missing data biases the system
// toward caution, never toward a falsely reassuring Green.
export interface DailyEntryStatusInputs {
  entrySubmittedToday: boolean;
  hasWearable: boolean;
  consecutiveMissedDays: number;
}

export interface DailyEntryStatusEffect {
  generateNewReading: boolean;
  colorCap?: ReadinessColor;
  confidenceOverride?: ConfidenceTier;
  flagCoach: boolean;
  note: string;
}

export function evaluateDailyEntryStatus(
  inputs: DailyEntryStatusInputs,
): DailyEntryStatusEffect {
  if (inputs.entrySubmittedToday) {
    return {
      generateNewReading: true,
      flagCoach: inputs.consecutiveMissedDays >= 3,
      note: "Daily entry received.",
    };
  }

  if (inputs.hasWearable) {
    return {
      generateNewReading: true,
      colorCap: "AMBER",
      confidenceOverride: "MODERATE",
      flagCoach: inputs.consecutiveMissedDays >= 3,
      note: "Daily entry skipped; reading generated from wearable trend alone, capped at Amber.",
    };
  }

  return {
    generateNewReading: false,
    flagCoach: true,
    note: "Daily entry skipped, no wearable connected; prior day's reading carried forward as unconfirmed.",
  };
}

// Section 8.7 / 8.5: absence of a pain report is never read as absence of pain.
export function evaluatePainStatus(painAnswered: boolean): {
  painKnown: boolean;
  confidenceNudgeDown: boolean;
} {
  return {
    painKnown: painAnswered,
    confidenceNudgeDown: !painAnswered,
  };
}
