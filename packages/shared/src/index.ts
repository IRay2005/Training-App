export type Role = "COACH" | "ATHLETE";

export type ExperienceClassification =
  | "FOUNDATION"
  | "DEVELOPING"
  | "TRAINED"
  | "ADVANCED";

export type ReadinessColor = "GREEN" | "AMBER" | "RED";

export type ConfidenceTier = "HIGH" | "MODERATE" | "LOW";

export type SessionSourceType = "MANUAL" | "WEARABLE_SYNC" | "ESTIMATED";

export type ProgressionDecision = "PROGRESS" | "MAINTAIN" | "REGRESS";

export interface DailyEntryInput {
  date: string;
  sorenessFatigue: number;
  stress: number;
  moodMotivation: number;
  hasPain: boolean;
  painLocation?: string;
  painSeverity?: number;
  sleepSelfReport?: number;
}

export interface ReadinessBreakdown {
  loadContribution: string;
  readinessContribution: string;
  confidenceContribution: string;
}

export interface ReadinessResult {
  date: string;
  score: number;
  color: ReadinessColor;
  confidenceTier: ConfidenceTier;
  breakdown: ReadinessBreakdown;
  overrideActive: boolean;
  overrideReason?: string;
}
