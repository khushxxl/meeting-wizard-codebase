import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const SYSTEM_PROMPT = `You are a helpful assistant inside Described, an AI meeting notes app.
You answer the user's questions about their meetings using the context provided below.

Rules:
- Be concise and specific. Prefer bullet points for lists.
- Format responses in markdown: use **bold**, bullet lists, and headings where useful.
- If the context does not contain the answer, say so clearly. Do not invent details.
- When referencing a meeting, include its title and date. When referencing action items, include the owner.
- Never use em dashes. Use commas, colons, or periods instead.`;

// Rough character budget for the combined meeting context block.
// gpt-4o-mini supports 128k tokens (~512k chars). We cap well below that
// so there's headroom for the system prompt, user turns, and the response.
const CONTEXT_CHAR_BUDGET = 180_000;
const PER_MEETING_CAP = 6_000;

interface ClientMessage {
  role: "user" | "assistant";
  content: string;
}

interface MeetingRow {
  id: string;
  title: string;
  scheduled_at: string;
  duration_seconds: number | null;
  status: string;
  google_meet_link: string | null;
  participants: unknown;
  meeting_notes: Array<{
    summary: string | null;
    action_items: unknown;
    key_points: unknown;
    decisions: unknown;
    transcript: unknown;
    raw_transcript: string | null;
  }>;
}

interface ProfileRow {
  full_name: string | null;
  email: string | null;
  auto_join_enabled: boolean | null;
  email_notifications: boolean | null;
  default_export_format: string | null;
  google_calendar_connected: boolean | null;
}

function clip(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

function formatMeeting(m: MeetingRow): string {
  const lines: string[] = [];
  const date = m.scheduled_at
    ? new Date(m.scheduled_at).toISOString().slice(0, 10)
    : "unknown date";
  const durationMin =
    typeof m.duration_seconds === "number"
      ? Math.round(m.duration_seconds / 60)
      : null;

  lines.push(`### ${m.title} (${date}, ${m.status})`);
  if (durationMin !== null) lines.push(`Duration: ${durationMin} min`);

  const participants = m.participants as Array<{ name: string }> | null;
  if (Array.isArray(participants) && participants.length > 0) {
    const names = participants.map((p) => p.name).filter(Boolean).join(", ");
    if (names) lines.push(`Participants: ${names}`);
  }

  const note = m.meeting_notes?.[0];
  if (note) {
    if (note.summary) lines.push(`Summary: ${clip(note.summary, 1200)}`);

    const actions = note.action_items as
      | Array<{ text: string; owner?: string; completed?: boolean }>
      | null;
    if (Array.isArray(actions) && actions.length > 0) {
      lines.push("Action items:");
      for (const a of actions) {
        const status = a.completed ? "✓" : "•";
        lines.push(`  ${status} ${clip(a.text ?? "", 200)} (${a.owner || "Unassigned"})`);
      }
    }

    const keyPoints = note.key_points as string[] | null;
    if (Array.isArray(keyPoints) && keyPoints.length > 0) {
      lines.push("Key points:");
      for (const k of keyPoints) lines.push(`  - ${clip(k, 200)}`);
    }

    const decisions = note.decisions as string[] | null;
    if (Array.isArray(decisions) && decisions.length > 0) {
      lines.push("Decisions:");
      for (const d of decisions) lines.push(`  - ${clip(d, 200)}`);
    }
  }

  const block = lines.join("\n");
  return clip(block, PER_MEETING_CAP);
}

function buildContext(profile: ProfileRow | null, meetings: MeetingRow[]) {
  const parts: string[] = [];

  if (profile) {
    const bits: string[] = [];
    if (profile.full_name) bits.push(`Name: ${profile.full_name}`);
    if (profile.email) bits.push(`Email: ${profile.email}`);
    bits.push(
      `Calendar connected: ${profile.google_calendar_connected ? "yes" : "no"}`
    );
    parts.push("## User profile\n" + bits.join("\n"));
  }

  if (meetings.length === 0) {
    parts.push("## Meetings\nNo meetings found for this user yet.");
    return parts.join("\n\n");
  }

  // Meetings are already sorted most-recent first from the query.
  // Include as many as fit in the budget.
  const rendered: string[] = [];
  let used = parts.join("\n\n").length;
  for (const m of meetings) {
    const block = formatMeeting(m);
    if (used + block.length > CONTEXT_CHAR_BUDGET) {
      rendered.push(
        `\n(Showing ${rendered.length} of ${meetings.length} meetings. Older meetings omitted to fit in context.)`
      );
      break;
    }
    rendered.push(block);
    used += block.length + 2;
  }

  parts.push(
    `## Meetings (${meetings.length} total, most recent first)\n\n` +
      rendered.join("\n\n")
  );
  return parts.join("\n\n");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    messages?: ClientMessage[];
  } | null;

  const messages = body?.messages ?? [];
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const cleaned = messages
    .slice(-30)
    .filter(
      (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  const [profileRes, meetingsRes] = await Promise.all([
    supabase
      .from("users")
      .select(
        "full_name, email, auto_join_enabled, email_notifications, default_export_format, google_calendar_connected"
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("meetings")
      .select(
        "id, title, scheduled_at, duration_seconds, status, google_meet_link, participants, meeting_notes(summary, action_items, key_points, decisions, transcript, raw_transcript)"
      )
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: false }),
  ]);

  const context = buildContext(
    (profileRes.data as ProfileRow | null) ?? null,
    (meetingsRes.data as MeetingRow[] | null) ?? []
  );

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      stream: true,
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          content: `User's full context from their Described account:\n\n${context}`,
        },
        ...cleaned,
      ],
    }),
  });

  if (!openaiRes.ok || !openaiRes.body) {
    const err = await openaiRes.text().catch(() => "");
    console.error("OpenAI chat error:", err);
    return NextResponse.json({ error: "Chat request failed" }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = openaiRes.body!.getReader();
      let buffer = "";
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // ignore keepalive / malformed frames
            }
          }
        }
        controller.close();
      } catch (err) {
        console.error("Chat stream error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
