# Described - Testing Guide

A short guide to try Described. Two options: use the hosted version (easiest) or run it locally from the project zip.

---

## Option 1: Use the hosted version (recommended)

The easiest way to evaluate Described.

1. Open **https://meeting-wizard.vercel.app**
2. Click **Sign in** and create an account (Google or email + password).
3. On the landing page, click **Download extension** to grab `described-extension.zip`.
4. Unzip it anywhere on your computer.
5. In Chrome, open `chrome://extensions`.
   - Toggle **Developer mode** on (top right).
   - Click **Load unpacked** and select the unzipped folder.
6. In the web app, go to **Settings &rarr; API Keys** and click **Create key**. Copy the key.
7. Click the Described icon in your Chrome toolbar, open **Settings**, and paste the API key.
   (The Server URL is already set to `https://meeting-wizard.vercel.app`.)
8. Open any tab with audio (Google Meet, Zoom in browser, a YouTube video, etc.), click the Described icon, and hit **Start recording**.
9. When done, click **Stop**, then **Upload**. The meeting appears in your dashboard within ~30 seconds with a transcript, summary, action items, key points, and decisions.

**Other things to try:**
- Click any meeting to view notes. Edit the summary, action items, or transcript inline.
- Use the **Upload** button in the bottom dock to drop in a `.txt` transcript and review it before AI processing.
- Use **Ask AI** in the bottom dock to query across all your meetings.
- Open a meeting and use the **Share via email** card on the right.

---

## Option 2: Run locally from the project zip

If you'd rather run everything on your own machine.

### Prerequisites

- Node.js 20 or newer (`node -v`)
- A free Supabase account (https://supabase.com)
- An OpenAI API key (https://platform.openai.com)
- (Optional) A Resend API key (https://resend.com) for the share-by-email feature

### Steps

1. Unzip the project. The folder contains two parts:
   - `meeting-wizard/` - the web app
   - `meeting-wizard-ext/` - the Chrome extension

2. **Set up Supabase:**
   - Create a new project at https://supabase.com.
   - In the SQL editor, run each file in `meeting-wizard/supabase/migrations/` in order (top to bottom).
   - From **Project Settings &rarr; API**, copy the Project URL, the anon key, and the service-role key.

3. **Configure the web app:**
   ```bash
   cd meeting-wizard
   cp .env.example .env.local
   ```
   Open `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   OPENAI_API_KEY=...
   GOOGLE_CLIENT_ID=...        # optional, only for Google sign-in
   GOOGLE_CLIENT_SECRET=...    # optional
   RESEND_API_KEY=...          # optional, only for share-by-email
   RESEND_FROM_EMAIL=Described <onboarding@resend.dev>
   ```
   Google OAuth and Resend are optional - email + password sign-in works without them.

4. **Start the app:**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000 and sign up.

5. **Install the Chrome extension:**
   - Open `chrome://extensions`, toggle **Developer mode** on.
   - Click **Load unpacked** and select the `meeting-wizard-ext/` folder.
   - Click the Described icon, open **Settings**, and:
     - Set **Server URL** to `http://localhost:3000`
     - Paste an **API key** generated under web app **Settings &rarr; API Keys**

6. Record a tab and upload (same as Option 1, step 8).

---

## Where things live (quick reference)

| What                          | Where                                              |
| ----------------------------- | -------------------------------------------------- |
| Sign in / sign up             | `/auth/signin`                                     |
| Dashboard                     | `/dashboard`                                       |
| Meetings list + calendar view | `/meetings`                                        |
| Meeting detail (notes)        | `/meetings/[id]`                                   |
| API key generation            | `/settings`                                        |
| Public docs                   | `/docs`                                            |

## Troubleshooting

- **Extension can't upload** - check the Server URL and API key in extension settings.
- **"No notes yet" after uploading** - check the browser dev-tools Network tab and the terminal running `npm run dev` for OpenAI errors.
- **Email confirmation fails** - in Supabase Auth settings, disable "Confirm email" while testing.
- **Mic permission popup closes** - open the extension popup in a full tab once: `chrome-extension://<extension-id>/popup.html`, grant the permission, then it works from the popup afterwards.

## Contact

For any setup issues, contact the project author.
