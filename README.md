# Described

AI-powered meeting notes. Record any browser tab + your mic, get a transcript, summary, action items, key points, and decisions auto-filed by date. Edit anything inline and share via email.

This repo contains two pieces:

- **`meeting-wizard/`** — Next.js 14 web app (dashboard, meeting library, settings, Ask AI chat, share-by-email, public landing + docs).
- **`meeting-wizard-ext/`** — Chrome MV3 extension that captures tab + mic audio and uploads it to the web app for transcription and structuring.

## Tech stack

- Next.js 14 (App Router) · React 18 · TypeScript
- Supabase (Postgres + Auth with Google OAuth and email/password + Storage)
- OpenAI Whisper (transcription) + GPT-4o-mini (structuring + Ask AI chat)
- Resend (transactional email for sharing notes)
- Tailwind 3.4 + shadcn/ui (base-nova) + Lucide
- Chrome MV3 (popup + service worker + offscreen `MediaRecorder`)

## Repo layout

```
meeting-wizard/                 Next.js app
  app/                          App Router routes
    api/                          extension upload, AI process, chat, share, ping
    (app)/                        protected dashboard / meetings / settings
    auth/                         OAuth + email-password flow
  components/                   UI (meetings, dashboard, layout, chat, onboarding)
  lib/                          supabase clients, openai, queries, api-keys, email template
  supabase/migrations/          SQL schema + RLS
  scripts/zip-extension.mjs     bundles the extension into public/ at build time

meeting-wizard-ext/             Chrome extension (Manifest V3)
  manifest.json
  popup.{html,js}               UI, settings, recording controls
  background.js                 service worker
  offscreen.{html,js}           MediaRecorder for tab + mic audio
```

## Prerequisites

- Node 20+
- A Supabase project (URL, anon key, service-role key)
- OpenAI API key
- Google OAuth client (for sign-in + Calendar)
- Resend API key (for share-by-email)

## Setup

```bash
cd meeting-wizard
cp .env.example .env.local        # fill in values
npm install
npm run dev                       # http://localhost:3000
```

Apply the SQL migrations under `meeting-wizard/supabase/migrations/` against your Supabase project (in order).

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=Described <onboarding@resend.dev>
```

## Chrome extension

The web app's landing page hosts a one-click download (`/described-extension.zip`), which is regenerated on every `npm run dev` / `npm run build` from `meeting-wizard-ext/`.

To install manually:

1. Open `chrome://extensions`, enable Developer mode.
2. **Load unpacked** &rarr; select the `meeting-wizard-ext/` folder (or unzip the download).
3. Open the popup, set the **Server URL** (defaults to `https://meeting-wizard.vercel.app`) and paste an **API key** generated in the web app's Settings page.

## Deployment

The web app deploys to Vercel from the `meeting-wizard/` subdirectory (set Root Directory in Vercel project settings).

A daily Vercel cron (`vercel.json`) hits `/api/ping` to keep the Supabase free-tier project from pausing after 7 days of inactivity.

## Scripts

```bash
npm run dev               # zip extension + start Next dev server
npm run build             # zip extension + production build
npm run start             # start production server
npm run lint              # next lint
npm run zip:extension     # rebuild public/described-extension.zip only
```
