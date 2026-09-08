import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../auth";
import { getOrComputeTodayReading } from "../readinessService";

// Resolves the athlete-profile row a request is allowed to act on. Athletes
// address their own profile with the literal segment "me"; coaches pass the
// actual athlete-profile id of one of their own athletes.
async function resolveAthleteProfileId(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<string | undefined> {
  const { athleteId: param } = request.params as { athleteId: string };

  if (request.user.role === "ATHLETE") {
    if (param !== "me") {
      reply.code(403).send({ error: "Athletes may only access their own profile (use 'me')." });
      return undefined;
    }
    const profile = await prisma.athleteProfile.findUnique({ where: { userId: request.user.userId } });
    if (!profile) {
      reply.code(404).send({ error: "Athlete profile not found." });
      return undefined;
    }
    return profile.id;
  }

  // COACH acting on a specific athlete
  const profile = await prisma.athleteProfile.findUnique({ where: { id: param } });
  if (!profile || profile.coachId !== request.user.userId) {
    reply.code(404).send({ error: "Athlete not found." });
    return undefined;
  }
  return profile.id;
}

const quickStartSchema = z.object({
  dateOfBirth: z.string().datetime().optional(),
  sex: z.string().optional(),
  heightCm: z.number().optional(),
  massKg: z.number().optional(),
  medicalConditions: z.string().optional(),
  medications: z.string().optional(),
  injuryStatus: z.string().optional(),
  trainingClearance: z.string().optional(),
  trainingAgeYears: z.number().optional(),
  currentSports: z.string().optional(),
  weeklyFrequency: z.number().int().optional(),
  avgWeeklyDurationMin: z.number().int().optional(),
  strengthFrequency: z.number().int().optional(),
  recentBreaks: z.string().optional(),
  longestRecentSessionMin: z.number().int().optional(),
  primaryGoal: z.string().optional(),
  goalEventDate: z.string().datetime().optional(),
  minWeeklyAvailability: z.number().int().optional(),
  maxWeeklyAvailability: z.number().int().optional(),
  hasWearable: z.boolean().optional(),
});

const dailyEntrySchema = z.object({
  sorenessFatigue: z.number().int().min(1).max(10),
  stress: z.number().int().min(1).max(10),
  moodMotivation: z.number().int().min(1).max(10),
  hasPain: z.boolean(),
  painLocation: z.string().optional(),
  painSeverity: z.number().int().min(1).max(10).optional(),
  sleepSelfReport: z.number().int().min(1).max(10).optional(),
  delayedFlag: z.boolean().optional(),
});

const sessionSchema = z.object({
  date: z.string().datetime(),
  modality: z.string(),
  durationMin: z.number().int().optional(),
  distanceKm: z.number().optional(),
  output: z.number().optional(),
  avgHeartRate: z.number().int().optional(),
  sessionRpe: z.number().int().min(0).max(10).optional(),
  completionPct: z.number().int().min(0).max(100).optional(),
  painDuring: z.boolean().optional(),
  nextDayResponse: z.string().optional(),
});

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function athleteRoutes(app: FastifyInstance) {
  app.get("/athletes/:athleteId", { preHandler: requireAuth }, async (request, reply) => {
    const athleteId = await resolveAthleteProfileId(request, reply);
    if (!athleteId) return;
    return prisma.athleteProfile.findUniqueOrThrow({
      where: { id: athleteId },
      include: { user: { select: { name: true, email: true } } },
    });
  });

  app.put("/athletes/:athleteId/profile", { preHandler: requireAuth }, async (request, reply) => {
    const athleteId = await resolveAthleteProfileId(request, reply);
    if (!athleteId) return;
    const body = quickStartSchema.parse(request.body);
    return prisma.athleteProfile.update({
      where: { id: athleteId },
      data: {
        ...body,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        goalEventDate: body.goalEventDate ? new Date(body.goalEventDate) : undefined,
      },
    });
  });

  app.post(
    "/athletes/:athleteId/daily-entry",
    { preHandler: requireRole("ATHLETE") },
    async (request, reply) => {
      const athleteId = await resolveAthleteProfileId(request, reply);
      if (!athleteId) return;
      const body = dailyEntrySchema.parse(request.body);

      if (body.hasPain && body.painSeverity === undefined) {
        return reply.code(400).send({ error: "painSeverity is required when hasPain is true." });
      }

      const today = startOfDay(new Date());
      const entry = await prisma.dailyEntry.upsert({
        where: { athleteId_date: { athleteId, date: today } },
        create: { athleteId, date: today, ...body },
        update: { ...body },
      });

      const reading = await getOrComputeTodayReading(athleteId);
      return { entry, reading };
    },
  );

  app.get(
    "/athletes/:athleteId/readiness/today",
    { preHandler: requireAuth },
    async (request, reply) => {
      const athleteId = await resolveAthleteProfileId(request, reply);
      if (!athleteId) return;
      return getOrComputeTodayReading(athleteId);
    },
  );

  app.post("/athletes/:athleteId/sessions", { preHandler: requireAuth }, async (request, reply) => {
    const athleteId = await resolveAthleteProfileId(request, reply);
    if (!athleteId) return;
    const body = sessionSchema.parse(request.body);
    return prisma.completedSession.create({
      data: { athleteId, ...body, date: new Date(body.date), sourceType: "MANUAL" },
    });
  });
}
