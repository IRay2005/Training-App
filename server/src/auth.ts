import type { FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "@ats/shared";

export interface JwtPayload {
  userId: string;
  role: Role;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: "Unauthorized" });
  }
}

export function requireRole(role: Role) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply);
    if (reply.sent) return;
    if (request.user.role !== role) {
      reply.code(403).send({ error: "Forbidden" });
    }
  };
}
