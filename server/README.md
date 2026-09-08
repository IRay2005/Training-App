# Adaptive Training System — server

Fastify + TypeScript + Prisma API implementing the decision engine from
`Adaptive_Training_System_v2_1.docx` (repo root). Uses Postgres both locally
(via `docker-compose.yml` at the repo root) and in production (Render — see
`../DEPLOYMENT.md`).

## Setup

```bash
docker compose up -d  # from the repo root — starts local Postgres
npm install            # from the repo root (npm workspaces)
npx prisma migrate dev
npm run dev            # from server/, or `npm run dev:server` from the repo root
```

Server listens on `http://localhost:4000` by default (see `.env`).

## Structure

- `src/engine/` — pure decision-engine functions (readiness scoring, confidence,
  missing-data rules). Unit tested in `*.test.ts` next to each module.
- `src/routes/` — HTTP handlers, thin wrappers around the engine + Prisma.
- `prisma/schema.prisma` — data model.

## Tests

```bash
npm test
```
