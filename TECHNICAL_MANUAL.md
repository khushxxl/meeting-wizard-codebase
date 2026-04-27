# Described (AI Meeting Wizard): Technical Manual

This manual is an appendix for the BSc Computing Science Honours Project at the University of Dundee. It documents the implementation of _Described_, an AI-powered meeting documentation system, in enough depth for a developer to set it up, run it, and extend it.

The system has two cooperating codebases in the same repository:

- `meeting-wizard/` is a Next.js 14 web application (dashboard, meeting detail pages, AI chat, settings).
- `meeting-wizard-ext/` is a Chrome extension (Manifest V3) that records browser tab audio mixed with the user's microphone and uploads the recording to the web application.

---

## 1. System Overview

### 1.1 What it does

A user installs the Chrome extension, signs into the web application with Google, generates an API key, and connects the extension to their account. They open any meeting tab (Google Meet, Zoom web client, a webinar, a lecture), click _Start Recording_ in the extension, and the extension captures both the tab audio and the user's microphone, mixes them in a single WebM stream, and uploads the file to the web application.

The web application stores the audio in private Supabase Storage, transcribes it using OpenAI Whisper, structures the transcript using OpenAI GPT-4o-mini, and saves the result as a _meeting_ row plus a _meeting_notes_ row in PostgreSQL. The user can then view the structured notes, listen back with a custom audio player, ask questions about all of their meetings via a streaming chat drawer, share the notes by email, and export them as PDF.

### 1.2 Tech stack with versions

Versions are taken directly from `meeting-wizard/package.json`.

| Layer                    | Library                                        | Version             |
| ------------------------ | ---------------------------------------------- | ------------------- |
| Web framework            | next                                           | 14.2.35             |
| UI runtime               | react, react-dom                               | 18.x                |
| Type system              | typescript                                     | 5.x                 |
| Backend / auth / storage | @supabase/supabase-js                          | 2.98.0              |
| Server-side Supabase     | @supabase/ssr                                  | 0.9.0               |
| Styling                  | tailwindcss                                    | 3.4.1               |
| Component primitives     | @base-ui/react                                 | 1.2.0               |
| Component CLI            | shadcn                                         | 4.0.2               |
| Icons                    | lucide-react                                   | 0.577.0             |
| Date utilities           | date-fns                                       | 4.1.0               |
| Schema validation        | zod                                            | 4.3.6               |
| PDF export               | jspdf, jspdf-autotable                         | 4.2.0, 5.0.7        |
| Markdown rendering       | react-markdown, remark-gfm                     | 10.1.0, 4.0.1       |
| Transactional email      | resend                                         | 6.12.2              |
| Class merging            | clsx, tailwind-merge, class-variance-authority | 2.1.1, 3.5.0, 0.7.1 |
| Linting                  | eslint, eslint-config-next                     | 8.x, 14.2.35        |

External services:

- OpenAI Whisper (`whisper-1`) for transcription.
- OpenAI GPT-4o-mini for structuring transcripts and powering the chat.
- Google OAuth 2.0 with `https://www.googleapis.com/auth/calendar.events.readonly` scope for calendar import.
- Supabase Auth (Google provider plus email + password), Supabase PostgreSQL, Supabase Storage.
- Resend for transactional email (sharing meeting notes by email).

The Chrome extension uses no external libraries. It is plain ES2020 JavaScript using the standard browser and `chrome.*` MV3 APIs.

---

## 2. Prerequisites

### 2.1 Software

- Node.js 20.x or later.
- npm 10.x (bundled with Node 20).
- Git.
- Google Chrome or any Chromium browser that supports Manifest V3 (Brave, Edge).
- A code editor (VS Code recommended).

### 2.2 Accounts

- A Supabase account and project (free tier is sufficient).
- An OpenAI account with billing enabled and an API key.
- A Google Cloud project with the Google Calendar API enabled and an OAuth 2.0 client.
- A Vercel account (for deployment).
- A GitHub account (for source control and deployment trigger).
- A Resend account with an API key (for sending shared meeting notes by email). Free tier is sufficient for development.

### 2.3 API keys to obtain

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase project settings.
- `SUPABASE_SERVICE_ROLE_KEY` from Supabase project settings (server-side only, never expose to the client).
- `OPENAI_API_KEY` from the OpenAI dashboard.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from the Google Cloud OAuth consent screen.
- `RESEND_API_KEY` from the Resend dashboard. Optional: `RESEND_FROM_EMAIL` (e.g. `Described <notes@yourdomain.com>`) once a sending domain is verified.

---

## 3. Repository Structure

```
meeting-wizard-codebase/
├── CLAUDE.md                           # Project-level notes for AI assistants
├── TECHNICAL_MANUAL.md                 # This document
├── examples/                           # Five demo transcripts for testing
│   ├── 01-product-standup.txt
│   ├── 02-sales-discovery-call.txt
│   ├── 03-design-review.txt
│   ├── 04-company-all-hands.txt
│   └── 05-one-on-one.txt
├── meeting-wizard/                     # Next.js 14 web app
│   ├── app/                            # App Router routes
│   │   ├── layout.tsx                  # Root layout (fonts, theme)
│   │   ├── page.tsx                    # Public landing page
│   │   ├── globals.css                 # Tailwind base + CSS variables
│   │   ├── (app)/                      # Auth-gated route group
│   │   │   ├── layout.tsx              # AppShell wrapper, profile bootstrap
│   │   │   ├── dashboard/page.tsx      # Stats, upcoming meetings
│   │   │   ├── meetings/page.tsx       # Meeting list with filters
│   │   │   ├── meetings/[id]/page.tsx  # Meeting detail, audio player, notes
│   │   │   └── settings/page.tsx       # Profile, integrations, API keys
│   │   ├── api/                        # API route handlers
│   │   │   ├── calendar/sync/route.ts  # GET upcoming Google Meet events
│   │   │   ├── chat/route.ts           # Streaming chat over user's data
│   │   │   ├── extension/upload/       # Bearer-auth audio upload
│   │   │   ├── keys/route.ts           # List + create API keys
│   │   │   ├── keys/[id]/route.ts      # Revoke API key
│   │   │   ├── meetings/[id]/share/    # Share meeting notes by email (Resend)
│   │   │   └── process/route.ts        # Text-only transcript processing
│   │   ├── auth/
│   │   │   ├── callback/route.ts       # Supabase OAuth callback handler
│   │   │   └── signin/page.tsx         # Email + password and Google sign-in UI
│   │   └── docs/                       # Public docs page
│   ├── components/
│   │   ├── chat/chat-drawer.tsx        # Right-side streaming chat panel
│   │   ├── dashboard/                  # StatsCards, UpcomingMeetings, etc.
│   │   ├── layout/                     # AppShell, Sidebar, Header, BottomDock
│   │   ├── meetings/                   # MeetingDetail, AudioPlayer, ShareByEmail
│   │   ├── onboarding/product-tour.tsx # First-run guided tour with spotlight
│   │   ├── settings/                   # ProfileForm, IntegrationsCard, ApiKeysCard
│   │   ├── shared/                     # Theme provider, page header
│   │   └── ui/                         # shadcn primitives (button, card, etc.)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser client
│   │   │   ├── server.ts               # Server (cookies-based) client
│   │   │   ├── middleware.ts           # Edge session refresher
│   │   │   └── admin.ts                # Service-role client (RLS bypass)
│   │   ├── openai.ts                   # transcribeAudio + structureTranscript
│   │   ├── api-keys.ts                 # generate/hash/verify Bearer keys
│   │   ├── google-calendar.ts          # Token refresh + event fetch
│   │   ├── email-template.ts           # HTML + text email renderer for sharing
│   │   ├── queries.ts                  # Typed Supabase query helpers
│   │   ├── constants.ts                # App constants
│   │   └── utils.ts                    # cn() helper
│   ├── types/database.ts               # Domain types and Supabase generic
│   ├── supabase/migrations/            # Three SQL migration files
│   ├── public/assets/                  # Hero background, icons
│   ├── middleware.ts                   # Next.js edge middleware entry
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── next.config.mjs
│   └── package.json
└── meeting-wizard-ext/                 # Chrome MV3 extension
    ├── manifest.json                   # Permissions, action, service worker
    ├── popup.html                      # Popup UI markup + inline CSS
    ├── popup.js                        # Popup behaviour, settings, upload
    ├── background.js                   # Service worker (state, message router)
    ├── offscreen.html                  # Container for offscreen document
    ├── offscreen.js                    # MediaRecorder, AudioContext mixing
    └── icons/                          # 16, 48, 128 px PNG icons
```

The two halves of the codebase are entirely independent. The extension only knows the web application as a server URL plus an API key.

---

## 4. Environment Configuration

The web application reads environment variables from `meeting-wizard/.env.local` during development and from Vercel project settings in production. The Chrome extension stores its configuration in `chrome.storage.local`, not in environment variables.

The expected variables, taken from `meeting-wizard/.env.example` and from grep over the codebase:

| Variable                        | Scope                    | Used in                                            | Purpose                                                  |
| ------------------------------- | ------------------------ | -------------------------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public (client + server) | `lib/supabase/{client,server,admin,middleware}.ts` | Supabase project base URL                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (client + server) | `lib/supabase/{client,server,middleware}.ts`       | Anonymous JWT used for end-user requests; subject to RLS |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only              | `lib/supabase/admin.ts`                            | Bypasses RLS; used only by the extension upload route    |
| `OPENAI_API_KEY`                | Server-only              | `lib/openai.ts`, `app/api/chat/route.ts`           | Whisper and Chat Completions                             |
| `GOOGLE_CLIENT_ID`              | Server-only              | `lib/google-calendar.ts` (token refresh)           | Google OAuth 2.0                                         |
| `GOOGLE_CLIENT_SECRET`          | Server-only              | `lib/google-calendar.ts`                           | Google OAuth 2.0                                         |
| `RESEND_API_KEY`                | Server-only              | `app/api/meetings/[id]/share/route.ts`             | Resend SDK auth for sending shared notes by email        |
| `RESEND_FROM_EMAIL`             | Server-only (optional)   | same                                               | Sender address; defaults to Resend sandbox if unset      |

`NEXT_PUBLIC_*` variables are inlined into the client bundle by Next.js at build time. Everything else is server-only and must never be referenced from a `"use client"` component.

The service role key is the most sensitive: it bypasses every Row Level Security policy. It is only loaded by `lib/supabase/admin.ts` and only used by the extension upload route, where the request is authenticated by an API key rather than a Supabase session cookie.

---

## 5. Database Schema

The schema is built up across three migrations in `meeting-wizard/supabase/migrations/`.

### 5.1 `001_initial_schema.sql`

Defines the base domain.

```sql
CREATE TYPE meeting_status AS ENUM (
  'scheduled', 'joining', 'recording',
  'processing', 'ready', 'failed'
);
```

**`users`** extends the Supabase managed `auth.users` table with profile and preference fields. The primary key is the same UUID as the auth user, with `ON DELETE CASCADE` so deletion of the auth row removes the profile.

| Column                  | Type        | Default    | Notes                                 |
| ----------------------- | ----------- | ---------- | ------------------------------------- |
| `id`                    | UUID        | (auth.uid) | PK, FK to `auth.users.id`             |
| `email`                 | TEXT        | required   |                                       |
| `full_name`             | TEXT        | `''`       |                                       |
| `avatar_url`            | TEXT        | `''`       |                                       |
| `auto_join_enabled`     | BOOLEAN     | `true`     | Reserved for future auto-join feature |
| `email_notifications`   | BOOLEAN     | `false`    |                                       |
| `default_export_format` | TEXT        | `'pdf'`    |                                       |
| `created_at`            | TIMESTAMPTZ | `now()`    |                                       |

**`meetings`** stores one row per meeting (recorded or pasted-in transcript or calendar import).

| Column             | Type           | Default             | Notes                               |
| ------------------ | -------------- | ------------------- | ----------------------------------- |
| `id`               | UUID           | `gen_random_uuid()` | PK                                  |
| `user_id`          | UUID           | required            | FK to `users.id`, ON DELETE CASCADE |
| `title`            | TEXT           | required            | Generated by GPT or user-supplied   |
| `scheduled_at`     | TIMESTAMPTZ    | required            |                                     |
| `duration_seconds` | INTEGER        | `0`                 |                                     |
| `google_meet_link` | TEXT           | `''`                |                                     |
| `status`           | meeting_status | `'scheduled'`       |                                     |
| `participants`     | JSONB          | `'[]'`              | `Array<{ name, email }>`            |
| `created_at`       | TIMESTAMPTZ    | `now()`             |                                     |
| `updated_at`       | TIMESTAMPTZ    | `now()`             | Maintained by trigger               |

**`meeting_notes`** is the AI-derived structured output, one row per meeting.

| Column         | Type        | Default             | Notes                                             |
| -------------- | ----------- | ------------------- | ------------------------------------------------- |
| `id`           | UUID        | `gen_random_uuid()` | PK                                                |
| `meeting_id`   | UUID        | required            | FK to `meetings.id`, ON DELETE CASCADE            |
| `summary`      | TEXT        | `''`                | Two to four sentences                             |
| `transcript`   | JSONB       | `'[]'`              | `Array<{ timestamp, speaker, text }>`             |
| `action_items` | JSONB       | `'[]'`              | `Array<{ id, text, owner, completed, due_date }>` |
| `key_points`   | JSONB       | `'[]'`              | `string[]`                                        |
| `decisions`    | JSONB       | `'[]'`              | `string[]`                                        |
| `created_at`   | TIMESTAMPTZ | `now()`             |                                                   |

A trigger keeps `meetings.updated_at` fresh on any row update:

```sql
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

Indexes are added on `meetings.user_id`, `meetings.scheduled_at`, `meetings.status`, and `meeting_notes.meeting_id` to keep dashboard and filter queries cheap.

### 5.2 `002_google_calendar.sql`

Adds Google OAuth token storage to the `users` table:

```sql
ALTER TABLE users
  ADD COLUMN google_access_token TEXT,
  ADD COLUMN google_refresh_token TEXT,
  ADD COLUMN google_token_expires_at TIMESTAMPTZ,
  ADD COLUMN google_calendar_connected BOOLEAN DEFAULT false;
```

Tokens are stored in plaintext, which is acceptable for a project of this scope but would be replaced with Supabase Vault encryption in a production deployment.

### 5.3 `003_extension_upload.sql`

Adds extension support: API keys, the Storage bucket for recordings, and two extra meeting-related columns.

**`api_keys`** stores per-user Bearer tokens for the extension. Only the SHA-256 hash of the key is persisted, never the raw key.

```sql
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Chrome Extension',
  prefix text not null,        -- first 12 chars of the key, shown in UI
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
```

Two extra columns are added:

- `meetings.audio_url` (TEXT, nullable): the Storage object path, format `<user_id>/<meeting_id>.webm`.
- `meeting_notes.raw_transcript` (TEXT, nullable): the unstructured Whisper output, stored alongside the structured form.

A private Supabase Storage bucket called `recordings` is created with three policies (read, insert, delete) all keyed on the first folder segment of the object name matching `auth.uid()::text`. This makes the user's UUID the _de facto_ namespace.

```sql
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;
```

### 5.4 Row Level Security policies

RLS is enabled on every application-owned table. A summary:

| Table                                     | Operation                      | Rule                                                                                                             |
| ----------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `users`                                   | SELECT, UPDATE, INSERT         | `auth.uid() = id`                                                                                                |
| `meetings`                                | SELECT, INSERT, UPDATE, DELETE | `auth.uid() = user_id`                                                                                           |
| `meeting_notes`                           | SELECT, INSERT, UPDATE         | `EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_notes.meeting_id AND meetings.user_id = auth.uid())` |
| `api_keys`                                | SELECT, INSERT, DELETE         | `auth.uid() = user_id`                                                                                           |
| `storage.objects` (bucket = `recordings`) | SELECT, INSERT, DELETE         | `auth.uid()::text = (storage.foldername(name))[1]`                                                               |

The extension upload route is the only path that touches the database without a Supabase session. It authenticates via an API key (Bearer header), looks up the corresponding `user_id`, and then uses the service role client to write rows. RLS is bypassed by design in this case because the API key itself is the access control.

### 5.5 JSONB design decision

`participants`, `transcript`, `action_items`, `key_points`, and `decisions` are all stored as JSONB rather than normalised into separate tables. This was a conscious trade-off:

**For JSONB:**

- The model output already arrives as JSON. Storing it as JSONB means a single insert per meeting with no fan-out, no IDs to mint, no foreign keys to maintain.
- Reads are dominated by _fetch one meeting's notes_. JSONB returns the whole structure in one round trip.
- Lists are short (typically less than ten action items, less than fifteen key points), so Postgres operators on JSONB are fast enough.
- Schema evolution is forgiving. Adding a `due_date` field to an action item does not require a migration.

**Against JSONB:**

- No referential integrity for owner names; cannot easily `JOIN` action items to a user table.
- Cannot index individual fields without an explicit GIN index.
- Cross-meeting analytics ("show me all incomplete action items assigned to Alice") require Postgres JSONB functions or extracting in application code.

The current scale (one user, tens to hundreds of meetings) does not need cross-meeting analytics, so JSONB is a clear win. If the system grew to a multi-tenant team product with cross-meeting reporting, normalising `action_items` into its own table would be the right next step.

---

## 6. Web Application Setup

### 6.1 Local installation

```bash
git clone https://github.com/khushxxl/meeting-wizard-codebase.git
cd meeting-wizard-codebase/meeting-wizard
npm install
cp .env.example .env.local
# Fill in real values for the six environment variables
```

### 6.2 Run the database migrations

In the Supabase SQL editor, run the three files in order: `001_initial_schema.sql`, `002_google_calendar.sql`, `003_extension_upload.sql`. The `recordings` Storage bucket is created automatically by `003`.

In the Supabase Auth section, enable the Google provider, paste in the Google OAuth client ID and secret, and add `http://localhost:3000/auth/callback` to the redirect URL allowlist.

In the Google Cloud Console for the same OAuth client, add the Supabase callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`) and the local callback (`http://localhost:3000/auth/callback`) to _Authorized redirect URIs_.

### 6.3 Run the dev server

```bash
npm run dev
```

The app boots on `http://localhost:3000`. The first login bootstraps the `users` row in `app/(app)/layout.tsx`. The middleware in `meeting-wizard/middleware.ts` intercepts every non-static request and refreshes the Supabase session cookie.

### 6.4 Build and deploy to Vercel

The app deploys to Vercel as a standard Next.js project.

```bash
cd meeting-wizard
vercel --prod
```

In the Vercel project settings, set the _Root Directory_ to `meeting-wizard` (the repository's web app lives in a subdirectory) and add the same six environment variables as `.env.local`. After the first deploy, add the production callback URL to both Supabase Auth and the Google Cloud OAuth client.

### 6.5 CI/CD with GitHub Actions

Vercel's GitHub integration is the actual CI/CD: any push to `main` triggers a production build, any push to a non-main branch creates a preview deployment with a unique URL. There is no separate GitHub Actions workflow file in this repository.

If Actions-based CI is preferred, the minimum useful workflow is `npm ci && npm run build && npx tsc --noEmit && npm run lint`, gated on pull requests. The `next build` command also runs the type check and the lint pass.

---

## 7. Chrome Extension Architecture

### 7.1 Manifest V3 structure

The extension's `manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Described",
  "version": "1.0.0",
  "permissions": ["tabCapture", "storage", "offscreen", "activeTab"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": { "16": "...", "48": "...", "128": "..." }
  },
  "background": { "service_worker": "background.js" }
}
```

Permission rationale:

- `tabCapture`: required to capture audio from the active browser tab.
- `storage`: persists the API key, server URL, recording history, and the _include microphone_ preference in `chrome.storage.local`.
- `offscreen`: required to create the offscreen document where MediaRecorder runs (see 7.3).
- `activeTab`: required so `chrome.tabCapture.getMediaStreamId` can resolve the active tab's stream ID under a user gesture.

There are no host permissions. Cross-origin uploads to the user-configured server URL succeed because the upload endpoint sends `Access-Control-Allow-Origin: *` and the request uses Bearer auth (no cookies).

### 7.2 Three-component design

The extension runs three contexts:

1. **Popup (`popup.html` + `popup.js`)** is the visible UI. It only exists while open. It owns the user gesture needed by `chrome.tabCapture.getMediaStreamId`.
2. **Background service worker (`background.js`)** is event-driven and ephemeral. It coordinates between popup and offscreen, holds the recording flag, and persists session metadata to `chrome.storage.local`.
3. **Offscreen document (`offscreen.html` + `offscreen.js`)** is a hidden DOM page. It runs `MediaRecorder` and the `AudioContext` graph.

The popup and the offscreen document never message each other directly. All traffic goes through the background service worker, which is the canonical message router.

### 7.3 Why an offscreen document is needed

In Manifest V2, `MediaRecorder` lived in the background page (a long-lived DOM context). In Manifest V3, the background became a service worker, which has no DOM and no `window`, so it cannot construct `MediaRecorder`, `AudioContext`, or `MediaStream`.

Chrome's solution is the offscreen document API: a hidden DOM page with no visible chrome that the extension can create on demand by declaring a _reason_. For audio capture the reason is `"USER_MEDIA"`. The background creates the offscreen document the first time the user starts a recording:

```js
async function ensureOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });
  if (existingContexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Recording tab audio via MediaRecorder",
  });
}
```

Without an offscreen document, the extension would have to open a new tab or popup window for every recording, which is hostile to users who are mid-meeting.

### 7.4 Audio capture flow

A complete recording is six steps. The user gesture is preserved through the entire chain because each step is initiated by a tool call that resolves before the next step begins.

```
Popup click
  ├─ chrome.tabs.query → active tab id
  ├─ navigator.mediaDevices.getUserMedia({audio:true})  // mic prompt, stream discarded
  ├─ chrome.tabCapture.getMediaStreamId({targetTabId})  // tab stream id
  └─ runtime.sendMessage({action: "startRecording", streamId, includeMic})
        ↓
Background
  ├─ ensureOffscreenDocument()
  └─ runtime.sendMessage({action: "offscreen-start", streamId, includeMic})
        ↓
Offscreen
  ├─ navigator.mediaDevices.getUserMedia({mandatory: {chromeMediaSource:"tab", chromeMediaSourceId:streamId}})  → tabStream
  ├─ navigator.mediaDevices.getUserMedia({audio:true})                                                          → micStream
  ├─ AudioContext.createMediaStreamDestination()
  ├─ tabSource.connect(destination); tabSource.connect(audioContext.destination);   // record + speakers
  ├─ micSource.connect(destination);                                                 // record only, no feedback
  └─ new MediaRecorder(destination.stream).start(1000)
```

Two design points to call out:

- The mic permission is requested **from the popup** even though the mic stream is acquired in the offscreen document. Chrome's `getUserMedia` permission prompt requires a user gesture, and offscreen documents have none. By calling `getUserMedia({audio:true})` in the popup once and then immediately stopping the resulting tracks, the permission is cached for the extension's origin and the offscreen document can re-acquire the mic silently.
- The tab audio is connected to **both** the destination (so it ends up in the recording) **and** `audioContext.destination` (the user's speakers, so they still hear the meeting). The microphone is connected **only** to the destination, never to the speakers, otherwise the user would hear themselves with a small delay and the system would feed back.

The mixed `MediaRecorder` produces an `audio/webm;codecs=opus` blob. The blob is converted to a data URL via `FileReader.readAsDataURL` and returned to the popup, where the user can click _Upload to Described_. On upload the data URL is fetched back into a blob and POSTed as `multipart/form-data` to `/api/extension/upload`.

---

## 8. Authentication Flow

There are two ways to sign in: Google OAuth (which also grants the calendar scope) and email + password. Both flows go through Supabase Auth and result in the same set of session cookies. New users get a `public.users` row created on their first protected-route load by `app/(app)/layout.tsx`, regardless of which method they used.

### 8.1 Sign-in via Supabase + Google OAuth

The landing page (`app/page.tsx`) calls `supabase.auth.signInWithOAuth` with the Google provider, requesting `https://www.googleapis.com/auth/calendar.events.readonly` and `access_type=offline` so a refresh token is issued.

Google redirects the user back to the Supabase auth subdomain, which then redirects to the application's `/auth/callback` route with a `code` query parameter. The callback handler is `meeting-wizard/app/auth/callback/route.ts`:

```ts
const { data: sessionData, error } =
  await supabase.auth.exchangeCodeForSession(code);
if (!error) {
  const providerToken = sessionData.session?.provider_token ?? null;
  const providerRefreshToken =
    sessionData.session?.provider_refresh_token ?? null;
  // ... upsert into public.users, persist Google tokens ...
}
```

`exchangeCodeForSession` returns both the Supabase session (which becomes a cookie) and the underlying provider's access and refresh tokens. The handler then either inserts a fresh row in `public.users` or updates the existing row, in both cases storing `google_access_token`, `google_refresh_token`, and `google_token_expires_at` (set to one hour from now). It then redirects to the `next` parameter (default `/dashboard`).

The Supabase session itself lives in three HTTP-only cookies set by `@supabase/ssr`. The middleware refreshes these cookies on every request (see 8.3).

### 8.2 Token refresh logic

Google access tokens expire after one hour. The application never trusts the stored expiry blindly; `lib/google-calendar.ts` checks freshness with a five-minute buffer, and if the token is stale it does the refresh flow against the Google OAuth endpoint and writes the new access token back to the database:

```ts
const res = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: tokens.google_refresh_token,
    grant_type: "refresh_token",
  }),
});
// ...
await supabase.from("users")
  .update({ google_access_token: newAccessToken, google_token_expires_at: ... })
  .eq("id", userId);
```

If the refresh fails (e.g. the user revoked access in their Google account), `getValidAccessToken` returns `null` and calendar sync silently returns an empty array.

### 8.3 Email + password sign-in / sign-up

`app/auth/signin/page.tsx` is a public client component with a single form that toggles between `signin` and `signup` modes. Sign-in calls `supabase.auth.signInWithPassword`; sign-up calls `supabase.auth.signUp` with `emailRedirectTo` set to `/auth/callback` so the confirmation link reuses the same callback handler as Google OAuth. If Supabase's "Confirm email" setting is on, sign-up shows a "Check your email" message; if off, the user is sent straight to `/dashboard`.

The same page also offers a "Continue with Google" button so the marketing page's CTA still has a one-click path, but users coming from the header `Sign in` link see both methods side by side.

A small client-side check enforces a minimum password length of six characters before submitting; everything else (existing user, weak password, invalid email) is delegated to Supabase and surfaced inline.

### 8.4 Middleware session guard

`meeting-wizard/middleware.ts` is a one-line wrapper that delegates to `lib/supabase/middleware.ts`. The matcher excludes static files. The wrapped function does three things:

1. Refreshes the session cookies via `@supabase/ssr` (which handles JWT rotation).
2. If the user is unauthenticated and the path starts with `/dashboard`, `/meetings`, or `/settings`, redirects to `/auth/signin` (the dedicated sign-in page).
3. If the user is authenticated and visits `/` or `/auth/signin`, redirects to `/dashboard` so they don't sign in twice.
4. The `/auth/callback` route remains accessible to logged-in users so the OAuth round trip and email-confirmation links work even when a session already exists.

A second guard exists at the layout level: `app/(app)/layout.tsx` is a Server Component that calls `supabase.auth.getUser()` and redirects to `/` if no user is returned. This ensures the layout cannot render with a missing user even if the middleware was somehow bypassed (e.g. during development with a stale cookie).

The `/docs` route is intentionally outside the `(app)` group and is publicly accessible. It detects the session itself and renders inside `AppShell` if logged in, or a minimal public layout if not.

---

## 9. API Routes

All routes live under `meeting-wizard/app/api/`. Five of the six are session-authenticated; only `/api/extension/upload` accepts a Bearer API key.

### 9.1 `POST /api/process`

**Purpose:** Convert a pasted text transcript into a structured meeting and meeting_notes pair.

**Auth:** Supabase session cookie.

**Request:**

```json
{ "transcript": "<plain text or VTT/SRT>" }
```

**Response (200):**

```json
{
  "meetingId": "uuid",
  "title": "string",
  "actionItemsCount": 0,
  "keyPointsCount": 0
}
```

**Errors:** `401 Unauthorized` on missing session, `400 Transcript is required`, `500 AI processing failed`, `500 Failed to save meeting`, `500 Failed to save notes`.

**Implementation:** Calls `structureTranscript` from `lib/openai.ts`, inserts a `meetings` row with `status: "ready"` and a `meeting_notes` row with the structured fields plus the original raw transcript.

### 9.2 `POST /api/extension/upload`

**Purpose:** Receive a recorded WebM audio blob from the Chrome extension, transcribe it, structure it, and persist it.

**Auth:** `Authorization: Bearer sk_mw_...` matching a SHA-256 hash in `api_keys`.

**Request:** `multipart/form-data` with fields:

- `audio` (required): the WebM blob.
- `duration_seconds` (optional): integer, used as the meeting duration.
- `recorded_at` (optional): ISO timestamp.

**Response (200):**

```json
{ "meetingId": "uuid", "status": "ready" }
```

**Errors:** `401 Invalid API key`, `400 Audio file is required`, `413 File exceeds 100 MB limit`, `500 Failed to store recording`, `500 Transcription or AI processing failed`.

**CORS:** Wildcard origin; `OPTIONS` preflight returns 204.

**Runtime:** `nodejs` with `maxDuration = 300` (five minutes), which accommodates Whisper for recordings up to roughly 90 minutes.

**Flow:**

1. Verify the API key via `verifyApiKey` and resolve the `user_id`.
2. Insert a `meetings` row in `processing` status.
3. Upload the blob to `recordings/<user_id>/<meeting_id>.webm` via the service-role admin client.
4. Update the meeting's `audio_url` to the object path.
5. Call Whisper with the original Blob.
6. Call GPT-4o-mini with the resulting transcript.
7. Update the meeting (title, duration, participants, status `ready`) and insert `meeting_notes`.
8. On any failure between steps 5 and 7, mark the meeting `failed` but leave the audio in Storage so it can be retried later.

### 9.3 `POST /api/chat`

**Purpose:** Streaming chat over the user's full meeting history.

**Auth:** Supabase session cookie.

**Request:**

```json
{ "messages": [{ "role": "user" | "assistant", "content": "string" }] }
```

**Response:** Plain text stream of GPT-4o-mini output deltas (`text/plain; charset=utf-8`). The endpoint translates OpenAI's SSE chunks into raw text on the fly so the client only needs `response.body.getReader()`.

**Context strategy:** The endpoint loads the user's profile and **all** meetings + notes from Supabase, then builds a single textual context block budgeted at 180,000 characters. Each meeting is clipped to 6,000 characters. If the budget is exhausted, older meetings are omitted with a visible note. The model is instructed to never invent details and to format with markdown; the chat drawer renders that markdown via `react-markdown`.

### 9.4 `GET /api/keys`, `POST /api/keys`, `DELETE /api/keys/[id]`

**Purpose:** Manage extension API keys.

**Auth:** Supabase session cookie.

`GET` returns the user's keys (id, name, prefix, created_at, last_used_at). `POST` generates a new key, returns the raw value **once** (it is never stored), and persists `(prefix, sha256_hex(raw))`. `DELETE` revokes a key by id, scoped to the calling user via a composite predicate (`user_id = auth.uid()`).

The hashing helper:

```ts
const KEY_PREFIX = "sk_mw_";

export function generateApiKey() {
  const raw = KEY_PREFIX + randomBytes(24).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 12);
  return { raw, hash, prefix };
}
```

### 9.5 `POST /api/meetings/[id]/share`

**Purpose:** Email a meeting's structured notes to one or more recipients via Resend.

**Auth:** Supabase session cookie. RLS on the `meetings` and `meeting_notes` tables guarantees the caller can only fetch a meeting they own.

**Request:**

```json
{
  "recipients": ["alice@example.com", "bob@example.com"],
  "note": "Optional personal note from the sender",
  "options": {
    "summary": true,
    "actionItems": true,
    "keyPoints": true,
    "decisions": true
  }
}
```

**Response (200):** `{ "ok": true, "sent": <number of recipients> }`.

**Errors:**

- `401 Unauthorized` on missing session.
- `400 At least one valid recipient is required.` (invalid email format or empty list).
- `400 Maximum 25 recipients per send.` (anti-abuse cap).
- `400 Select at least one section to include.`
- `400 This meeting has no notes yet.`
- `404 Meeting not found` (meeting does not exist or RLS denies access).
- `503 Email sending is not configured` if `RESEND_API_KEY` is unset (lets the deploy run without Resend wired up).
- `502` if the Resend SDK rejects the send.

**Flow:**

1. Validate the request body, recipient format, and option set.
2. Fetch the meeting + its single `meeting_notes` row through the user-scoped Supabase client.
3. Look up the sender's `full_name` and `email` from `public.users` for the email's footer.
4. Build the email via `lib/email-template.ts` (see 10.4).
5. Send through the Resend SDK with `replyTo` set to the sender's own email so recipients can reply directly.

The route uses Node runtime (`runtime = "nodejs"`) because the Resend SDK depends on Node primitives that are not in the Edge runtime.

### 9.6 `POST /api/calendar/sync`

**Purpose:** Fetch upcoming Google Meet events from Google Calendar.

**Auth:** Supabase session cookie.

**Response:** `{ events: CalendarEvent[], count: number }`.

**Implementation:** Delegates to `getUpcomingCalendarEvents` (in `lib/google-calendar.ts`), which loads the user's stored Google tokens, refreshes them if necessary, calls Calendar API v3, filters events that have a Google Meet link, and maps them to the `CalendarEvent` shape. Nothing is persisted; the dashboard simply renders the response.

---

## 10. AI Processing Pipeline

The AI work happens in two OpenAI calls, both wrapped in `lib/openai.ts`.

### 10.1 Whisper transcription

```ts
export async function transcribeAudio(
  audio: Blob,
  filename = "recording.webm",
): Promise<string> {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", "whisper-1");
  form.append("response_format", "text");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Whisper error: ${err}`);
  }

  return (await response.text()).trim();
}
```

`response_format: "text"` keeps the response as plain text rather than the default JSON envelope, simplifying error handling and avoiding a second parse step. Whisper accepts files up to 25 MB. The extension upload route caps at 100 MB but in practice WebM Opus stays well below 25 MB for meetings up to ~90 minutes.

### 10.2 GPT-4o-mini structuring

The model is asked for _strictly JSON_ output. The full system prompt:

```
You are a meeting notes assistant. Given a meeting transcript, produce structured notes in JSON format.

Return ONLY valid JSON with this exact schema:
{
  "title": "A concise meeting title derived from the content",
  "summary": "A 2-4 sentence summary of the meeting covering key topics discussed",
  "action_items": [
    {
      "id": "a1",
      "text": "Description of the action item",
      "owner": "Person responsible (use speaker name if mentioned, otherwise 'Unassigned')",
      "completed": false,
      "due_date": null
    }
  ],
  "key_points": ["Key point 1", "Key point 2"],
  "decisions": ["Decision 1", "Decision 2"],
  "transcript": [
    {
      "timestamp": "00:00:00",
      "speaker": "Speaker Name",
      "text": "What they said"
    }
  ],
  "participants": [
    { "name": "Speaker Name", "email": "" }
  ],
  "duration_minutes": 30
}

Rules:
- Extract real speaker names from the transcript if present
- If the transcript has timestamps, preserve them. If not, generate approximate ones.
- Never use em dashes in any output. Use commas, colons, or periods instead.
- Be specific with action items: include who should do what
- Key points should capture important information shared
- Decisions should capture any agreements or conclusions reached
- Keep the summary concise but informative
- If you can't determine participants, use "Participant 1", "Participant 2" etc.
- Return ONLY the JSON, no markdown fences or extra text
```

The user message is `Process this meeting transcript:\n\n${transcript.slice(0, 30000)}`. The 30,000-character cap (~7,500 tokens) protects against accidentally sending an enormous transcript that would push the prompt past the model's input window or run up the bill on a single call.

The call parameters:

| Parameter     | Value         | Reason                                                                             |
| ------------- | ------------- | ---------------------------------------------------------------------------------- |
| `model`       | `gpt-4o-mini` | Cost-quality sweet spot for structured extraction (see 11.5)                       |
| `temperature` | `0.3`         | Low entropy, consistent JSON; high enough to allow phrasing variation in summaries |
| `max_tokens`  | `4000`        | Comfortably exceeds the longest realistic structured output                        |

After the response arrives, any markdown fences around the JSON are stripped defensively (the prompt forbids them, but smaller models occasionally leak `\`\`\`json`):

````ts
const cleaned = content
  .replace(/```json\n?/g, "")
  .replace(/```\n?/g, "")
  .trim();
return JSON.parse(cleaned);
````

If the JSON parse throws, the route returns a 500 to the caller; no partial save is performed.

### 10.3 Output schema (TypeScript)

The structured output type is declared in `lib/openai.ts`:

```ts
export interface StructuredNotes {
  title: string;
  summary: string;
  action_items: unknown[];
  key_points: string[];
  decisions: string[];
  transcript: unknown[];
  participants: { name: string; email: string }[];
  duration_minutes: number;
}
```

`action_items` and `transcript` are `unknown[]` rather than typed structures because the type is enforced at the database level (JSONB column) and at the consumer level (the TranscriptTab and ActionItemsTab components define their own narrow types). This keeps the OpenAI helper unopinionated about UI-side shape changes.

### 10.4 Email rendering for shared notes

`lib/email-template.ts` is a pure renderer that takes the meeting, the sender's chosen sections and personal note, the absolute meeting URL, and the sender's display name, and returns `{ subject, html, text }`.

- The HTML is table-based markup with inline styles (the only thing email clients render reliably). It includes a blue gradient header, the optional sender note in a left-bordered callout, conditional sections for summary, action items (with completed strike-through and owner labels), key points, and decisions, and an "Open in Described" CTA button.
- The plain-text fallback mirrors the same content for clients that strip HTML.
- All user-provided strings are HTML-escaped via a small local helper. The `note` field is also clamped to 1,000 characters server-side before reaching the renderer.

The renderer never touches the database, so it is trivial to unit-test against fixture meeting objects.

### 10.5 Onboarding tour

`components/onboarding/product-tour.tsx` is a reusable, page-scoped guided tour. It accepts `tourId` (used as a `localStorage` namespace) and `steps`, looks up each step's target element via a `data-tour-id` attribute, and renders a spotlight (a transparent box with a 9999px outer box-shadow that dims everything else) plus a tooltip with progress dots and Back / Skip / Next controls.

Two tours are currently defined:

- `DASHBOARD_TOUR` (six steps) introduces the sidebar, stats cards, bottom dock, and Settings link.
- `MEETINGS_TOUR` (four steps) explains the list/calendar toggle, filtering, and clicking into a meeting.

The shell mounts the appropriate tour based on `pathname`. Each tour's completion flag is stored under `described:tour-completed:<tourId>`, so finishing one does not suppress the other.

---

## 11. Key Technical Decisions

### 11.1 JSONB instead of normalised tables

Discussed in 5.5. The short version: AI output already is JSON; lists are short; the only common access pattern is _fetch one meeting_; schema evolution is forgiving. The cost is the inability to do cross-meeting analytics in SQL without JSONB operators.

### 11.2 SHA-256 hashed API keys with a visible prefix

API keys are 24 random bytes encoded as base64url with the literal prefix `sk_mw_`. Only the SHA-256 hash and the first 12 characters (the prefix used in the UI) are persisted.

```ts
export function generateApiKey() {
  const raw = KEY_PREFIX + randomBytes(24).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 12);
  return { raw, hash, prefix };
}
```

Alternatives:

- **Encrypt and store the raw key** (so the user can re-fetch it). Rejected because it forces the server to hold the raw key, defeating the point of the user's _secret_.
- **Bcrypt** instead of SHA-256. Rejected because keys are 32 bytes of high entropy; deliberate slow hashing matters for low-entropy human passwords, not for high-entropy machine keys, and bcrypt would slow every API call.
- **Cryptographic signature (HMAC of a key id)**. Slightly cleaner but requires holding a server-side secret for HMAC; not justified at this scale.

The visible `prefix` lets the user identify which key is which in the UI without storing the raw value.

### 11.3 AudioContext mixing instead of `ChannelMergerNode`

The extension mixes the tab and microphone streams by `connect`-ing both into a single `MediaStreamDestination`:

```js
const destination = audioContext.createMediaStreamDestination();
const tabSource = audioContext.createMediaStreamSource(tabStream);
tabSource.connect(destination);
tabSource.connect(audioContext.destination); // also play to speakers
const micSource = audioContext.createMediaStreamSource(micStream);
micSource.connect(destination);
```

`ChannelMergerNode` would put each source on a separate channel of a multi-channel output, producing a stereo file with tab-on-left and mic-on-right. That sounds nice in theory but:

- WebM Opus does support multi-channel, but downstream consumers (Whisper, the audio player, every email recipient) overwhelmingly assume mono or summed stereo. Channel-separated audio plays back asymmetrically.
- Whisper transcribes a summed signal more reliably than two competing channels. Speaker overlap stays where it actually was.
- A summed stream is half the storage size.

Implicit summation via two `connect` calls into one destination produces exactly the desired summed mono behaviour without any extra plumbing.

### 11.4 Offscreen document instead of opening a tab

Discussed in 7.3. The constraint is structural: Manifest V3 service workers have no DOM, and `MediaRecorder` requires a DOM. The alternatives were:

- **Open a new tab containing the recorder**. Hostile UX; users have to keep an unrelated tab alive during their meeting.
- **Run MediaRecorder in the popup itself**. The popup unmounts when it loses focus, which kills the recording the moment the user clicks back into their meeting tab.
- **Stay on Manifest V2**. Chrome stopped accepting V2 submissions in 2024.

The offscreen document API is purpose-built for exactly this: an invisible DOM context that can be created on demand, lives across popup closes, and is allowed `getUserMedia` with a justified reason.

### 11.5 GPT-4o-mini instead of GPT-4o (or GPT-3.5-turbo)

The structured-extraction task is well within the capability of a small model: it is reading a transcript, copying out factual information, and emitting a fixed JSON schema. GPT-4o-mini was chosen because:

- Latency is roughly four times faster than GPT-4o at this prompt size, which matters for the user-facing flow where the meeting goes from `processing` to `ready`.
- Cost per call is roughly fifteen times cheaper than GPT-4o.
- In side-by-side comparisons against a handful of test transcripts, the structured output quality was indistinguishable for summaries and action items; only highly nuanced multi-party debates showed any quality drop, which is acceptable for an MVP.
- GPT-3.5-turbo (the older small model) was rejected because of weaker JSON-schema adherence: it occasionally emitted markdown fences or commentary even when explicitly instructed not to.

The chat endpoint uses the same model for the same reasons plus one extra: streaming. GPT-4o-mini's tokens-per-second is high enough that the user sees a typewriter-like response, which feels far more responsive than waiting for a complete answer.

### 11.6 Resend for transactional email

Sharing meeting notes by email is implemented as a server-rendered HTML email sent through Resend. Alternatives considered:

- **SMTP via Nodemailer** to a personal Gmail or transactional account. Rejected because deliverability for cold-from addresses is poor and SPF/DKIM setup adds friction.
- **Amazon SES**. Cheaper at scale but heavier setup (sandbox approval, verified senders, IAM) than necessary for an MVP.
- **Postmark** or **SendGrid**. Both viable; Resend was chosen for its simple SDK, generous free tier (3,000 emails/month, 100/day), built-in domain verification flow, and React Email compatibility for future template work.

The route degrades gracefully: if `RESEND_API_KEY` is missing, the endpoint returns 503 and the UI surfaces a friendly error rather than crashing the whole page.

### 11.7 Box-shadow spotlight for the product tour

The first-run tour cuts a "hole" in a dark backdrop to spotlight a UI element. Three implementations were considered:

- **SVG `<mask>` with a circle/rect cutout**. Robust but adds an SVG element, and animating its position on scroll is awkward.
- **CSS `clip-path`**. Pixel-precise control but inherits the cutout shape from the active element, complicating rounded corners and multi-region cutouts.
- **A transparent box with a 9999px outer `box-shadow`**. The shadow paints everything outside the element with a dim colour, achieving the same visual effect with no extra DOM nodes and no fight with `overflow:hidden` ancestors.

The shadow trick wins on simplicity. The same div carries a 2px primary-blue ring as a `box-shadow` second layer, giving the spotlight a clear focus indicator.

---

## 12. Extending the System

### 12.1 Add support for a new meeting platform

Tab capture works against any tab; there is nothing platform-specific in the recording path. The only platform-specific code is the Google Calendar import in `lib/google-calendar.ts`. To add Zoom imports:

1. Add Zoom OAuth columns to `users` (or, better, a generic `external_calendars` table with `provider`, `access_token`, `refresh_token`, `expires_at`).
2. Implement a `lib/zoom.ts` analogue of `lib/google-calendar.ts` with `getValidAccessToken` and `fetchUpcomingMeetings`.
3. Add a `/api/zoom/sync` route mirroring `/api/calendar/sync`.
4. Surface the connect/disconnect button in `components/settings/integrations-card.tsx`.
5. Update the dashboard's _Upcoming Meetings_ component to merge events from both providers.

The recording side does not need to change: the user simply opens their Zoom web client tab and clicks Start.

### 12.2 Modify the AI output schema

The schema is enforced in three places:

1. The system prompt in `lib/openai.ts`.
2. The `StructuredNotes` interface in the same file.
3. The columns of `meeting_notes`.

To add a new field (say, `risks: string[]`):

1. Update the prompt's example JSON and the _Rules_ block.
2. Add `risks: string[]` to `StructuredNotes`.
3. Add a migration: `ALTER TABLE meeting_notes ADD COLUMN risks JSONB DEFAULT '[]'::jsonb;`.
4. Update the inserts in `app/api/process/route.ts` and `app/api/extension/upload/route.ts`.
5. Add a tab to the meeting detail page (`components/meetings/meeting-detail-client.tsx`).

The chat endpoint will pick up the new field automatically because it serialises every note field generically into the context.

### 12.3 Add speaker diarisation

Whisper does not perform speaker diarisation. The current pipeline asks GPT to invent speaker labels heuristically, which is unreliable. Two production-grade routes:

- **Replace Whisper with a service that diarises** (AssemblyAI or Deepgram). Both accept a single audio file and return a transcript with speaker turns. Swapping is roughly thirty lines of code in `lib/openai.ts` (renaming the function, switching the URL and request body).
- **Record and upload two separate streams** (tab and microphone) instead of one mixed stream. The extension already has both streams in `offscreen.js`; producing two `MediaRecorder` instances and uploading both files would let the backend transcribe each separately and label the mic transcript as _You_. This identifies the extension user vs. everyone else without per-attendee enrolment, but does not separate multiple attendees in the tab stream from each other.

A third, lower-priority option is voice fingerprinting (Resemblyzer + per-user enrolment). The complexity is not worth it at this scale.

### 12.4 Add editing functionality to meeting notes

Action item completion is already editable via Supabase's RLS-protected updates (see `components/meetings/action-items-tab.tsx`'s optimistic update against the JSONB column). To allow editing other fields:

- Add inline editors for `summary`, `key_points`, and `decisions` in `meeting-detail-client.tsx`.
- Persist with a Supabase `update` against `meeting_notes`. RLS already permits the update if the meeting is owned by the caller.
- For the transcript, consider a row-per-segment table; editing a single segment in a long JSONB array is awkward and forces a full rewrite of the column on every edit.
- Add a `revision` integer column to `meeting_notes` and use optimistic concurrency control (`update where revision = old`) if multiple editors are expected.

---

## 13. Known Limitations

The following limitations are visible in the current code and should be acknowledged in any deployment.

### 13.1 Browser-only recording

Recording requires the meeting to play through a browser tab. Native desktop clients (Zoom desktop, Microsoft Teams desktop, Webex client) cannot be captured by `chrome.tabCapture`. The user must use the web client of their meeting platform.

### 13.2 No real-time transcription

Audio is uploaded **after** the meeting ends, not streamed during. Real-time transcription would require a WebRTC or WebSocket pipeline streaming PCM chunks to a streaming Whisper deployment. The current architecture defers all AI work to the upload route.

### 13.3 No rate limiting

There are no rate limits on `/api/process`, `/api/extension/upload`, `/api/keys`, or `/api/chat`. A leaked API key or a misbehaving extension could drain the OpenAI budget. Mitigations for production:

- Vercel Edge middleware with a fixed-window rate limit (free, simple).
- Upstash Ratelimit (Redis-backed, supports per-user tiers).
- Per-user monthly token budgets enforced server-side using the OpenAI usage response.

### 13.4 OpenAI cost considerations

Whisper is billed at $0.006 per minute of audio. GPT-4o-mini for structuring runs at roughly $0.0001 per 1,000 input tokens and $0.0004 per 1,000 output tokens, which works out to roughly $0.005 to $0.015 per meeting depending on transcript length. The chat endpoint reads the user's full history per message, which scales linearly with archive size and is the largest single cost driver if many users actively chat. Production systems should add caching of the prompt context (OpenAI's prompt caching can recycle the meetings block across consecutive turns) and a maximum-meetings-per-context cap.

### 13.5 No retry UI for failed processing

If Whisper or GPT fails, the meeting is marked `failed` and the audio is preserved in Storage. There is no end-user _Retry processing_ button; the meeting can only be reprocessed manually via the database. A useful follow-up would be a `/api/meetings/[id]/reprocess` route that reads the existing `audio_url`, re-runs Whisper plus GPT, and atomically swaps the meeting back to `ready`.

### 13.6 Plaintext Google tokens

Google access and refresh tokens are stored unencrypted in `users.google_*`. Acceptable for a single-user prototype, not acceptable for a production multi-tenant system. Production replacement: Supabase Vault encryption-at-rest with a per-row encryption key, decrypted server-side only when needed.

### 13.7 No tests

The repository contains no unit or integration tests. For a project of this scope this is acceptable, but the risk surface is in three places: the API key verification (auth boundary), the offscreen audio mixing graph (silent failure mode if a connection is wrong), and the OpenAI JSON parsing (silent failure if the model breaks the schema). A future release should add unit tests for `lib/api-keys.ts`, contract tests for `/api/extension/upload`, and a small synthetic integration test that runs the full pipeline against a recorded WAV.

---

_End of technical manual._
