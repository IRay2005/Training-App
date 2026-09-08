import { prisma } from "./db";
import { computeConfidence } from "./engine/confidence";
import { evaluateDailyEntryStatus } from "./engine/missingData";
import { computeReadiness } from "./engine/readiness";
import type { ReadinessColor, ReadinessResult } from "@ats/shared";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function scaleOneToTen(value: number): number {
  return ((value - 1) / 9) * 100;
}

async function countConsecutiveMissedDays(athleteId: string, before: Date): Promise<number> {
  let missed = 0;
  for (let i = 1; i <= 14; i++) {
    const day = new Date(before);
    day.setDate(day.getDate() - i);
    const entry = await prisma.dailyEntry.findUnique({
      where: { athleteId_date: { athleteId, date: startOfDay(day) } },
    });
    if (entry) break;
    missed++;
  }
  return missed;
}

// Computes (and persists) today's readiness reading for an athlete, applying
// the Section 8.5 missing-data rules when no entry has been submitted yet.
export async function getOrComputeTodayReading(athleteProfileId: string): Promise<ReadinessResult & { note: string }> {
  const today = startOfDay(new Date());
  const profile = await prisma.athleteProfile.findUniqueOrThrow({ where: { id: athleteProfileId } });

  const existingReading = await prisma.readinessReading.findUnique({
    where: { athleteId_date: { athleteId: athleteProfileId, date: today } },
  });
  if (existingReading) {
    return {
      date: today.toISOString(),
      score: existingReading.score,
      color: existingReading.color as ReadinessColor,
      confidenceTier: existingReading.confidenceTier as any,
      breakdown: JSON.parse(existingReading.breakdownJson),
      overrideActive: existingReading.overrideActive,
      overrideReason: existingReading.overrideReason ?? undefined,
      note: "Today's reading.",
    };
  }

  const consecutiveMissedDays = await countConsecutiveMissedDays(athleteProfileId, today);
  const todaysEntry = await prisma.dailyEntry.findUnique({
    where: { athleteId_date: { athleteId: athleteProfileId, date: today } },
  });

  const entryStatus = evaluateDailyEntryStatus({
    entrySubmittedToday: Boolean(todaysEntry),
    hasWearable: profile.hasWearable,
    consecutiveMissedDays,
  });

  if (!entryStatus.generateNewReading) {
    const priorReading = await prisma.readinessReading.findFirst({
      where: { athleteId: athleteProfileId },
      orderBy: { date: "desc" },
    });
    if (!priorReading) {
      return {
        date: today.toISOString(),
        score: 50,
        color: "AMBER",
        confidenceTier: "LOW",
        breakdown: {
          loadContribution: "No data yet.",
          readinessContribution: "No daily entry submitted yet.",
          confidenceContribution: "Confidence: low — no data available.",
        },
        overrideActive: false,
        note: entryStatus.note,
      };
    }
    return {
      date: today.toISOString(),
      score: priorReading.score,
      color: priorReading.color as ReadinessColor,
      confidenceTier: "LOW",
      breakdown: { ...JSON.parse(priorReading.breakdownJson), readinessContribution: "Carried forward — unconfirmed." },
      overrideActive: priorReading.overrideActive,
      overrideReason: priorReading.overrideReason ?? undefined,
      note: entryStatus.note,
    };
  }

  const recentSession = await prisma.completedSession.findFirst({
    where: { athleteId: athleteProfileId, date: { gte: new Date(today.getTime() - 7 * 86400000) } },
  });

  const wellness = todaysEntry
    ? (scaleOneToTen(todaysEntry.sorenessFatigue) +
        scaleOneToTen(todaysEntry.stress) +
        scaleOneToTen(todaysEntry.moodMotivation)) /
      3
    : undefined;

  const sleep =
    todaysEntry?.sleepSelfReport !== null && todaysEntry?.sleepSelfReport !== undefined
      ? scaleOneToTen(todaysEntry.sleepSelfReport)
      : undefined;

  const confidenceTier = computeConfidence({
    dailyEntrySubmittedToday: Boolean(todaysEntry),
    sleepDataAvailable: sleep !== undefined,
    hrvAvailable: false,
    restingHrAvailable: false,
    recentPerformanceReadinessAvailable: false,
    recentTrainingDataAvailable: Boolean(recentSession),
    hasWearable: profile.hasWearable,
    consecutiveMissedDays,
  });

  const result = computeReadiness({
    components: { wellness, sleep },
    pain: {
      hasPain: todaysEntry?.hasPain ?? false,
      painSeverity: todaysEntry?.painSeverity ?? undefined,
    },
    confidenceTier: entryStatus.confidenceOverride ?? confidenceTier,
    colorCap: entryStatus.colorCap,
  });

  await prisma.readinessReading.create({
    data: {
      athleteId: athleteProfileId,
      date: today,
      score: result.score,
      color: result.color,
      confidenceTier: entryStatus.confidenceOverride ?? confidenceTier,
      breakdownJson: JSON.stringify(result.breakdown),
      overrideActive: result.overrideActive,
      overrideReason: result.overrideReason,
    },
  });

  return {
    date: today.toISOString(),
    score: result.score,
    color: result.color,
    confidenceTier: entryStatus.confidenceOverride ?? confidenceTier,
    breakdown: result.breakdown,
    overrideActive: result.overrideActive,
    overrideReason: result.overrideReason,
    note: entryStatus.note,
  };
}
