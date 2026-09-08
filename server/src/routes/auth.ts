import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../auth";
import type { Role } from "@ats/shared";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerCoachSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const inviteAthleteSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  // Section 1: this is a single-coach system. Registration is open only until
  // a coach account exists, then it's closed — the coach invites athletes
  // from there (Section 3).
  app.post("/auth/register-coach", async (request, reply) => {
    const existingCoach = await prisma.user.findFirst({ where: { role: "COACH" } });
    if (existingCoach) {
      return reply.code(403).send({ error: "A coach account already exists." });
    }

    const body = registerCoachSchema.parse(request.body);
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { email: body.email, passwordHash, name: body.name, role: "COACH" },
    });

    const token = app.jwt.sign({ userId: user.id, role: user.role as Role });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });

  app.post("/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }
    const token = app.jwt.sign({ userId: user.id, role: user.role as Role });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });

  // Section 3: coach creates the athlete account; onboarding detail is added
  // progressively afterward via the profile endpoints.
  app.post(
    "/auth/coach/invite-athlete",
    { preHandler: requireRole("COACH") },
    async (request, reply) => {
      const body = inviteAthleteSchema.parse(request.body);
      const existing = await prisma.user.findUnique({ where: { email: body.email } });
      if (existing) {
        return reply.code(409).send({ error: "A user with that email already exists." });
      }

      const passwordHash = await bcrypt.hash(body.password, 10);
      const athleteUser = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          name: body.name,
          role: "ATHLETE",
          athleteProfile: {
            create: { coachId: request.user.userId },
          },
        },
        include: { athleteProfile: true },
      });

      return {
        user: { id: athleteUser.id, email: athleteUser.email, name: athleteUser.name },
        athleteProfileId: athleteUser.athleteProfile!.id,
      };
    },
  );

  app.get("/auth/me", { preHandler: requireAuth }, async (request) => {
    const user = await prisma.user.findUnique({ where: { id: request.user.userId } });
    if (!user) return { user: null };
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });
}
