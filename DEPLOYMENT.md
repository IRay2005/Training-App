# Deploying the app

This turns the local project into something you can actually use: a live
server, a website usable from any computer, and an installable Android app.
The pieces:

- **Server** — deploys to [Render](https://render.com) (free tier), using
  `render.yaml` in this repo. Render also hosts the web build.
- **Web** — the same Expo app, exported to static HTML/JS and hosted as a
  Render static site. Works on any computer, and on iPhone via
  "Add to Home Screen".
- **Android** — built as a real installable `.apk` via
  [EAS Build](https://docs.expo.dev/build/introduction/) (Expo's free cloud
  build service). No Play Store needed.
- **iOS native install** — skipped. Sideloading an `.ipa` without a Mac
  requires a paid Apple Developer account ($99/yr). The web app covers iOS
  in the meantime (see below).

None of the accounts below can be created on your behalf — you'll need to
sign up yourself (a few minutes each), then hand control back for the actual
deploy commands where noted.

## 1. Push this repo to GitHub

Render deploys from a Git repo.

```bash
git init
git add .
git commit -m "Initial commit"
```

Then create an empty repo at https://github.com/new (don't initialize it
with a README), and:

```bash
git remote add origin https://github.com/<you>/<repo-name>.git
git branch -M main
git push -u origin main
```

## 2. Deploy the server + web site to Render

1. Sign up at https://render.com (free) and connect your GitHub account.
2. Dashboard → **New +** → **Blueprint** → pick this repo. Render reads
   `render.yaml` and creates three resources: `ats-db` (Postgres),
   `ats-server` (the API), and `ats-web` (the static website).
3. Click **Apply** and wait for both services to finish deploying.
4. Open the `ats-server` service page and copy its URL (something like
   `https://ats-server.onrender.com`, possibly with a random suffix if that
   name was taken).
5. If the URL differs from the placeholder, update it in two places and
   push:
   - [render.yaml](render.yaml) — the `EXPO_PUBLIC_API_URL` value under the
     `ats-web` service
   - [mobile/eas.json](mobile/eas.json) — both `preview` and `production`
     profiles

   ```bash
   git add render.yaml mobile/eas.json
   git commit -m "Point web/mobile builds at the deployed server URL"
   git push
   ```

   Render redeploys `ats-web` automatically on push (Blueprint services stay
   in sync with `render.yaml`).

**Free-tier note:** the free Postgres database is deleted after 90 days
unless upgraded to a paid plan; the free web service also spins down after
15 minutes of inactivity and takes ~30s to wake back up on the next request.
Fine for personal/small-group use; upgrade the relevant Render plan if that
becomes annoying.

### Create the first coach account

There's no sign-up screen yet — only login (`mobile/src/screens/LoginScreen.tsx`).
Create the first account directly against the deployed API:

```bash
curl -X POST https://ats-server.onrender.com/auth/register-coach \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"choose-a-real-password","name":"Your Name"}'
```

That account can then log in from the mobile app or the website, and (per
`mobile/src/api.ts`'s `inviteAthlete`) invite athletes from the coach
dashboard.

## 3. Build the installable Android app

```bash
npm install -g eas-cli
cd mobile
eas login              # creates/uses your free Expo account
eas build:configure    # links this project to your Expo account, sets a real EAS project ID in app.json
eas build --platform android --profile production
```

EAS builds in the cloud (a few minutes) and gives you a download link for a
signed `.apk`. Open that link on an Android phone to download and install it
directly — no Play Store required. Android will prompt to allow installs
from that source the first time.

## 4. Use it on iPhone / iPad

Open the `ats-web` URL from Render in Safari, then **Share → Add to Home
Screen**. It behaves like an installed app (own icon, launches without
Safari's UI) even without going through the App Store.

## 5. Use it on a computer

Just open the `ats-web` Render URL in any browser.

## Local development (unchanged, but now uses Postgres instead of SQLite)

```bash
docker compose up -d          # starts local Postgres (see docker-compose.yml)
npm install
npx prisma migrate deploy --schema server/prisma/schema.prisma
npm run dev:server
npm run dev:mobile            # in a second terminal
```
