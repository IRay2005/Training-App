-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "sex" TEXT,
    "heightCm" DOUBLE PRECISION,
    "massKg" DOUBLE PRECISION,
    "medicalConditions" TEXT,
    "medications" TEXT,
    "injuryStatus" TEXT,
    "trainingClearance" TEXT,
    "trainingAgeYears" DOUBLE PRECISION,
    "currentSports" TEXT,
    "weeklyFrequency" INTEGER,
    "avgWeeklyDurationMin" INTEGER,
    "strengthFrequency" INTEGER,
    "recentBreaks" TEXT,
    "longestRecentSessionMin" INTEGER,
    "primaryGoal" TEXT,
    "goalEventDate" TIMESTAMP(3),
    "minWeeklyAvailability" INTEGER,
    "maxWeeklyAvailability" INTEGER,
    "extendedHealthJson" TEXT,
    "extendedHistoryJson" TEXT,
    "performanceTestsJson" TEXT,
    "equipmentJson" TEXT,
    "experienceClassification" TEXT NOT NULL DEFAULT 'FOUNDATION',
    "selfManageEnabled" BOOLEAN NOT NULL DEFAULT false,
    "hasWearable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyEntry" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sorenessFatigue" INTEGER NOT NULL,
    "stress" INTEGER NOT NULL,
    "moodMotivation" INTEGER NOT NULL,
    "hasPain" BOOLEAN NOT NULL DEFAULT false,
    "painLocation" TEXT,
    "painSeverity" INTEGER,
    "sleepSelfReport" INTEGER,
    "delayedFlag" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WearableDailyMetric" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "restingHeartRate" INTEGER,
    "hrvMs" DOUBLE PRECISION,
    "sleepDurationMin" INTEGER,
    "sleepQualityScore" DOUBLE PRECISION,
    "bodyBatteryScore" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'STUB',

    CONSTRAINT "WearableDailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedSession" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "modality" TEXT NOT NULL,
    "primaryAdaptationTarget" TEXT,
    "plannedDurationMin" INTEGER,
    "plannedIntensityDomain" TEXT,
    "isKeySession" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlannedSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletedSession" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "plannedSessionId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "modality" TEXT NOT NULL,
    "durationMin" INTEGER,
    "distanceKm" DOUBLE PRECISION,
    "output" DOUBLE PRECISION,
    "avgHeartRate" INTEGER,
    "sessionRpe" INTEGER,
    "completionPct" INTEGER,
    "painDuring" BOOLEAN NOT NULL DEFAULT false,
    "nextDayResponse" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompletedSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadinessReading" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "score" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "confidenceTier" TEXT NOT NULL,
    "breakdownJson" TEXT NOT NULL,
    "overrideActive" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadinessReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Override" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "confirmedByUserId" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "chosenAction" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Override_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "priorityWeight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteProfile_userId_key" ON "AthleteProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyEntry_athleteId_date_key" ON "DailyEntry"("athleteId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WearableDailyMetric_athleteId_date_key" ON "WearableDailyMetric"("athleteId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessReading_athleteId_date_key" ON "ReadinessReading"("athleteId", "date");

-- AddForeignKey
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyEntry" ADD CONSTRAINT "DailyEntry_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WearableDailyMetric" ADD CONSTRAINT "WearableDailyMetric_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedSession" ADD CONSTRAINT "PlannedSession_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedSession" ADD CONSTRAINT "CompletedSession_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedSession" ADD CONSTRAINT "CompletedSession_plannedSessionId_fkey" FOREIGN KEY ("plannedSessionId") REFERENCES "PlannedSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessReading" ADD CONSTRAINT "ReadinessReading_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Override" ADD CONSTRAINT "Override_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

