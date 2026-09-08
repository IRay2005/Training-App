import type { ConfidenceTier } from "@ats/shared";

// Section 11: confidence = available reliable inputs / recommended inputs.
// The spec leaves the exact input list and thresholds as "to be calibrated"
// (Section 9.3), so this is a defensible starting formula, not a fixed law.
export interface ConfidenceInputs {
  dailyEntrySubmittedToday: boolean;
  sleepDataAvailable: boolean;
  hrvAvailable: boolean;
  restingHrAvailable: boolean;
  recentPerformanceReadinessAvailable: boolean;
  recentTrainingDataAvailable: boolean;
  hasWearable: boolean;
  consecutiveMissedDays: number;
}

const RECOMMENDED_INPUT_COUNT = 6;

export function computeConfidence(inputs: ConfidenceInputs): ConfidenceTier {
  // Section 8.5: three or more consecutive missed daily entries caps
  // confidence low regardless of everything else.
  if (inputs.consecutiveMissedDays >= 3) return "LOW";

  const availableCount = [
    inputs.dailyEntrySubmittedToday,
    inputs.sleepDataAvailable,
    inputs.hrvAvailable,
    inputs.restingHrAvailable,
    inputs.recentPerformanceReadinessAvailable,
    inputs.recentTrainingDataAvailable,
  ].filter(Boolean).length;

  const ratio = availableCount / RECOMMENDED_INPUT_COUNT;

  let tier: ConfidenceTier = ratio >= 0.8 ? "HIGH" : ratio >= 0.5 ? "MODERATE" : "LOW";

  // Section 8.4: a client with no connected wearable can never reach the
  // same confidence tier as a wearable-connected client.
  if (!inputs.hasWearable && tier === "HIGH") tier = "MODERATE";

  return tier;
}
