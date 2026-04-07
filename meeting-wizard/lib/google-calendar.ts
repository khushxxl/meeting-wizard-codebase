import type { SupabaseClient } from "@supabase/supabase-js";

interface GoogleTokens {
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expires_at: string | null;
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType: string; uri: string }>;
  };
  attendees?: Array<{ email: string; displayName?: string }>;
  status?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  google_meet_link: string;
  participants: Array<{ name: string; email: string }>;
}

async function getValidAccessToken(
  supabase: SupabaseClient,
  userId: string,
  tokens: GoogleTokens
): Promise<string | null> {
  if (!tokens.google_access_token) return null;

  // Check if token is still valid (with 5 min buffer)
  if (tokens.google_token_expires_at) {
    const expiresAt = new Date(tokens.google_token_expires_at).getTime();
    if (Date.now() < expiresAt - 5 * 60 * 1000) {
      return tokens.google_access_token;
    }
  }

  // Token expired, try to refresh
  if (!tokens.google_refresh_token) return null;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

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

  if (!res.ok) return null;

  const data = await res.json();
  const newAccessToken = data.access_token;
  const expiresIn = data.expires_in ?? 3600;

  // Update stored token
  await supabase
    .from("users")
    .update({
      google_access_token: newAccessToken,
      google_token_expires_at: new Date(
        Date.now() + expiresIn * 1000
      ).toISOString(),
    })
    .eq("id", userId);

  return newAccessToken;
}

async function fetchCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "20",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return data.items ?? [];
}

/**
 * Fetches upcoming Google Meet events directly from the Calendar API.
 * Does NOT store anything in the database.
 */
export async function getUpcomingCalendarEvents(
  supabase: SupabaseClient,
  userId: string
): Promise<CalendarEvent[]> {
  const { data: user } = await supabase
    .from("users")
    .select(
      "google_access_token, google_refresh_token, google_token_expires_at, google_calendar_connected"
    )
    .eq("id", userId)
    .single();

  if (!user?.google_calendar_connected) return [];

  const accessToken = await getValidAccessToken(supabase, userId, user);
  if (!accessToken) return [];

  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const events = await fetchCalendarEvents(
    accessToken,
    now.toISOString(),
    twoWeeksLater.toISOString()
  );

  // Only return events with a Google Meet link
  return events
    .filter((e) => {
      if (e.status === "cancelled") return false;
      if (e.hangoutLink) return true;
      if (
        e.conferenceData?.entryPoints?.some(
          (ep) => ep.entryPointType === "video"
        )
      )
        return true;
      return false;
    })
    .map((event) => {
      const startTime =
        event.start?.dateTime ?? event.start?.date ?? now.toISOString();
      const endTime = event.end?.dateTime ?? event.end?.date;

      let durationMinutes = 0;
      if (startTime && endTime) {
        durationMinutes = Math.round(
          (new Date(endTime).getTime() - new Date(startTime).getTime()) /
            60000
        );
      }

      let meetLink = event.hangoutLink ?? "";
      if (!meetLink && event.conferenceData?.entryPoints) {
        const videoEntry = event.conferenceData.entryPoints.find(
          (ep) => ep.entryPointType === "video"
        );
        if (videoEntry) meetLink = videoEntry.uri;
      }

      const participants = (event.attendees ?? []).map((a) => ({
        name: a.displayName ?? a.email.split("@")[0],
        email: a.email,
      }));

      return {
        id: event.id,
        title: event.summary ?? "Untitled",
        scheduled_at: startTime,
        duration_minutes: durationMinutes,
        google_meet_link: meetLink,
        participants,
      };
    });
}
