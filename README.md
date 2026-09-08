# Adaptive Training, Readiness and Programming System

Implementation of `Adaptive_Training_System_v2_1.docx` — a coach/athlete
training-management app that scores daily readiness, recommends
progress/maintain/regress decisions, and gives the coach a dashboard while
letting select athletes self-manage. Build plan: `Adaptive_Training_System_v2_1.docx`
plus the phased plan in this repo's history (Section 29 MVP).

## Structure

- `server/` — Fastify + TypeScript + Prisma API. The decision engine
  (readiness scoring, confidence, missing-data rules) lives in `server/src/engine/`
  as pure, unit-tested functions. See `server/README.md`.
- `mobile/` — Expo (React Native) app with a coach dashboard and an athlete
  daily-entry/readiness screen. Runs on iOS, Android, or web (`npm run web`).
- `packages/shared/` — TypeScript types shared between server and mobile.

## Running locally

```bash
docker compose up -d                                           # starts local Postgres
npm install
npx prisma migrate dev --schema server/prisma/schema.prisma    # first time only
npm run dev:server     # starts the API on :4000
npm run dev:mobile      # in a second terminal — starts Expo (scan the QR code, or press w for web)
```

The mobile app talks to `http://localhost:4000` by default (Android emulator
uses `10.0.2.2` automatically). Override with `EXPO_PUBLIC_API_URL`.

## Deploying / installing on a phone or computer

See [DEPLOYMENT.md](DEPLOYMENT.md) — hosting the server + web app on Render,
building an installable Android APK via EAS, and using it on iPhone/desktop.

## Status

Section 29 MVP, Phases 0-1 complete: auth (coach/athlete roles, coach invites
athletes), quick-start profile, daily 4-question entry, manual session
logging, the readiness/confidence/missing-data engine, and the coach
dashboard — all wearable-free (Section 8.4 fallback path).

Not yet built (see the docx for the full spec): planned-weekly-schedule input
and planned-vs-completed tracking (Section 23), 7/14/28-day trends and the
weekly progression recommendation (Sections 7, 13, 14), the wearable stub
adapter and real overrides (Sections 10.1, 25, 26), offline queueing and push
notifications (Section B). Real Garmin integration (Section 25) additionally
needs Garmin Developer Program approval, which is outside of what can be done
in code.
