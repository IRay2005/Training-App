import type { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { requireRole } from "../auth";
import { getOrComputeTodayReading } from "../readinessService";
import type { ReadinessColor } from "@ats/shared";

const COLOR_URGENCY: Record<ReadinessColor, number> = { RED: 0, AMBER: 1, GREEN: 2 };

// Section 26.3: coach dashboard ranked by what needs attention first.
export async function coachRoutes(app: FastifyInstance) {
  app.get("/coach/dashboard", { preHandler: requireRole("COACH") }, async (request) => {
    const athletes = await prisma.athleteProfile.findMany({
      where: { coachId: request.user.userId },
      include: { user: { select: { name: true, email: true } } },
    });

    const rows = await Promise.all(
      athletes.map(async (athlete) => {
        const reading = await getOrComputeTodayReading(athlete.id);
        const activePain = reading.overrideActive && reading.color !== "GREEN";
        return {
          athleteId: athlete.id,
          name: athlete.user.name,
          readiness: reading,
          activePainOrRed: activePain || reading.color === "RED",
        };
      }),
    );

    rows.sort((a, b) => {
      if (a.activePainOrRed !== b.activePainOrRed) return a.activePainOrRed ? -1 : 1;
      return COLOR_URGENCY[a.readiness.color] - COLOR_URGENCY[b.readiness.color];
    });

    return { clients: rows };
  });
}
