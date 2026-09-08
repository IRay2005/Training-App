import Fastify from "fastify";
import jwt from "@fastify/jwt";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth";
import { athleteRoutes } from "./routes/athletes";
import { coachRoutes } from "./routes/coach";

const app = Fastify({ logger: true });

// Dev-only: the Expo web preview runs on a different origin (localhost:8081)
// than the API (localhost:4000). Native mobile clients aren't subject to CORS.
app.register(cors, { origin: true });

app.register(jwt, {
  secret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
});

app.register(authRoutes);
app.register(athleteRoutes);
app.register(coachRoutes);

app.get("/health", async () => ({ ok: true }));

const port = Number(process.env.PORT ?? 4000);
app
  .listen({ port, host: "0.0.0.0" })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
