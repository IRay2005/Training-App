# Getting this app onto your phone and computer

Right now the app only runs on this laptop. To make it a real app you can
install and use anywhere, you need to do 4 things, in order. Each one takes
a few minutes. I've already written all the config files — you just need to
click through some sign-ups and run some commands.

**Quick definitions** (skip if you already know these):

| Term | What it means here |
|---|---|
| **Render** | A free website that runs your server 24/7, so your phone/computer can talk to it over the internet instead of only on this laptop. |
| **GitHub** | Where your code lives online. Render reads your code from here. |
| **EAS / Expo** | The service that turns your app into a real installable Android file (`.apk`), so you don't need the Google Play Store. |
| **APK** | The Android install file — like a `.exe` on Windows, but for Android phones. |
| **Postgres** | The database that stores your users and training data. |

---

## ✅ Step 1 — Put your code on GitHub

*Why: Render needs to read your code from somewhere online — it can't see your laptop.*

Run this in the project folder:

```bash
git init
git add .
git commit -m "Initial commit"
```

Then:
1. Go to **https://github.com/new**, create a new repo (leave it empty — don't check "add a README").
2. GitHub will show you a URL like `https://github.com/yourname/your-repo.git`. Copy it.
3. Run, replacing the URL with yours:

```bash
git remote add origin https://github.com/yourname/your-repo.git
git branch -M main
git push -u origin main
```

---

## ✅ Step 2 — Turn on the server (Render)

*Why: this is what makes the app "live" — without it, nothing works, not the phone app or the website.*

1. Sign up free at **https://render.com** and connect it to your GitHub account.
2. Click **New +** → **Blueprint** → choose the repo you just pushed.
3. Render finds the `render.yaml` file already in this project and automatically sets up 3 things for you: the database, the server, and the website. Click **Apply**.
4. Wait a few minutes for it to finish (you'll see green "Live" statuses).
5. Click into the service named **ats-server** and copy its web address at the top — it'll look like `https://ats-server.onrender.com` (Render sometimes adds random letters if that name's taken).

**If your address is different from `https://ats-server.onrender.com`**, tell me the real one and I'll update the two config files that reference it ([render.yaml](render.yaml) and [mobile/eas.json](mobile/eas.json)) — otherwise the phone app and website won't be able to find your server.

### Create your login

There's no "Sign Up" button yet — the first account has to be created with one command. Run this once (swap in your own email/password/name):

```bash
curl -X POST https://ats-server.onrender.com/auth/register-coach \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"choose-a-real-password","name":"Your Name"}'
```

That's now your login for the app (as a coach). Coaches can invite athletes later from inside the app.

> **Good to know:** on Render's free plan, the server "falls asleep" after 15 minutes of no use and takes ~30 seconds to wake up on the next request. The free database also gets deleted after 90 days unless you upgrade. Fine for now — just know it's not lost forever, just a free-tier limitation.

---

## ✅ Step 3 — Get an installable Android app

*Why: this produces the actual file you download onto an Android phone.*

```bash
npm install -g eas-cli
cd mobile
eas login
eas build:configure
eas build --platform android --profile production
```

- `eas login` — makes/uses a free Expo account (sign up if it asks).
- `eas build:configure` — one-time setup, just press enter through its prompts.
- `eas build` — this is the one that takes a few minutes. When it finishes, it prints a **link**.

Open that link **on the Android phone itself** (email it to yourself, or open it in the phone's browser) and tap it to download and install. Android will ask to "allow installs from this source" the first time — say yes.

---

## ✅ Step 4 — iPhone and computer (no extra steps needed)

These don't need installing anything — they just use the website Render built for you (the `ats-web` service from Step 2). Find its URL on the Render dashboard.

- **On a computer:** open that URL in any browser. Done.
- **On an iPhone:** open that URL in Safari, tap the **Share** icon, then **Add to Home Screen**. It now behaves like an installed app with its own icon.

(iPhone can't get a "real" installed app like Android without a paid $99/year Apple developer account — the home-screen shortcut is the free equivalent.)

---

## Recap: what you actually have to go do right now

1. Push code to GitHub (Step 1)
2. Sign up for Render, click "Apply" on the Blueprint, copy the server URL (Step 2)
3. Run the one `curl` command to create your login (Step 2)
4. Sign up for Expo, run the 3 `eas` commands, install the APK on your phone (Step 3)
5. Bookmark/add-to-home-screen the website URL on your computer and iPhone (Step 4)

Everything else (the actual config) is already done.

---

## Local development (only if you want to keep coding on this laptop)

```bash
docker compose up -d          # starts a local database
npm install
npx prisma migrate deploy --schema server/prisma/schema.prisma
npm run dev:server
npm run dev:mobile            # in a second terminal
```
