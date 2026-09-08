import type { ConfidenceTier, ReadinessBreakdown, ReadinessColor } from "@ats/shared";

// Section 9.1 starting weights — explicitly a defensible starting point to be
// calibrated per client against real data (Section 9.3), not a fixed formula.
const WEIGHTS = {
  wellness: 0.45,
  sleep: 0.15,
  hrv: 0.2,
  restingHr: 0.1,
  performance: 0.1,
} as const;

type ComponentKey = keyof typeof WEIGHTS;

export interface ReadinessComponents {
  /** 0-100, average of soreness/fatigue + stress + mood from Section 8.1 */
  wellness?: number;
  /** 0-100, wearable sleep trend or Section 8.4 self-report fallback */
  sleep?: number;
  /** 0-100, 7-day rolling HRV deviation (wearable only) */
  hrv?: number;
  /** 0-100, resting heart rate trend (wearable only) */
  restingHr?: number;
  /** 0-100, periodic performance-readiness check (Section 8.6) */
  performance?: number;
}

export interface PainStatus {
  hasPain: boolean;
  painSeverity?: number;
}

export interface ComputeReadinessParams {
  components: ReadinessComponents;
  pain: PainStatus;
  confidenceTier: ConfidenceTier;
  /** From missingData.evaluateDailyEntryStatus — caps color regardless of score */
  colorCap?: ReadinessColor;
}

export interface ReadinessComputation {
  score: number;
  color: ReadinessColor;
  overrideActive: boolean;
  overrideReason?: string;
  breakdown: ReadinessBreakdown;
}

// Confidence is applied as a bound (Section 9.1): a low-confidence day cannot
// produce an extreme reading in either direction.
const CONFIDENCE_BOUNDS: Record<ConfidenceTier, [number, number]> = {
  HIGH: [0, 100],
  MODERATE: [15, 85],
  LOW: [30, 70],
};

const COLOR_RANK: Record<ReadinessColor, number> = { RED: 0, AMBER: 1, GREEN: 2 };

function weightedScore(components: ReadinessComponents): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const key of Object.keys(WEIGHTS) as ComponentKey[]) {
    const value = components[key];
    if (value !== undefined) {
      weightedSum += value * WEIGHTS[key];
      totalWeight += WEIGHTS[key];
    }
  }
  // No usable inputs at all — neutral midpoint; caller decides via
  // missingData whether a reading should be generated this day at all.
  if (totalWeight === 0) return 50;
  return weightedSum / totalWeight;
}

function scoreToColor(score: number): ReadinessColor {
  if (score >= 75) return "GREEN";
  if (score >= 45) return "AMBER";
  return "RED";
}

function weakestComponent(components: ReadinessComponents): string {
  const entries = (Object.keys(WEIGHTS) as ComponentKey[])
    .map((key) => [key, components[key]] as const)
    .filter((entry): entry is [ComponentKey, number] => entry[1] !== undefined);
  if (entries.length === 0) return "no data available";
  const [lowestKey] = entries.reduce((a, b) => (b[1] < a[1] ? b : a));
  const labels: Record<ComponentKey, string> = {
    wellness: "self-reported wellness",
    sleep: "sleep",
    hrv: "HRV",
    restingHr: "resting heart rate",
    performance: "performance readiness",
  };
  return labels[lowestKey];
}

export function computeReadiness(params: ComputeReadinessParams): ReadinessComputation {
  const { components, pain, confidenceTier, colorCap } = params;

  const rawScore = weightedScore(components);
  const [low, high] = CONFIDENCE_BOUNDS[confidenceTier];
  const boundedScore = Math.min(high, Math.max(low, rawScore));
  const score = Math.round(boundedScore);

  let color = scoreToColor(score);
  let overrideActive = false;
  let overrideReason: string | undefined;

  // Section 10 / 8.7: pain always overrides the calculated reading.
  if (pain.hasPain) {
    overrideActive = true;
    if (pain.painSeverity !== undefined && pain.painSeverity >= 6) {
      overrideReason = "Pain reported at high severity — treated as Red regardless of score.";
      color = "RED";
    } else {
      overrideReason = "Pain reported — reading cannot show Green while pain is active.";
      if (color === "GREEN") color = "AMBER";
    }
  }

  // Section 9.1: cannot show Green if the self-reported wellness block is missing.
  if (components.wellness === undefined && color === "GREEN") {
    color = "AMBER";
  }

  // Section 8.5: missing-data-driven color cap (e.g. skipped entry -> Amber cap).
  if (colorCap && COLOR_RANK[color] > COLOR_RANK[colorCap]) {
    color = colorCap;
  }

  const breakdown: ReadinessBreakdown = {
    loadContribution: "Load status not yet factored in (added in a later phase).",
    readinessContribution:
      pain.hasPain
        ? "Pain override active."
        : `Driven mainly by ${weakestComponent(components)}.`,
    confidenceContribution: `Confidence: ${confidenceTier.toLowerCase()}${
      confidenceTier !== "HIGH" ? " — reading kept conservative as a result." : "."
    }`,
  };

  return { score, color, overrideActive, overrideReason, breakdown };
}
