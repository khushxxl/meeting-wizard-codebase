import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { renderMeetingEmail, type ShareOptions } from "@/lib/email-template";

export const runtime = "nodejs";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Described <onboarding@resend.dev>";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email sending is not configured (missing RESEND_API_KEY)." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    recipients?: unknown;
    note?: unknown;
    options?: unknown;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const recipients = Array.isArray(body.recipients)
    ? body.recipients.filter(
        (r): r is string => typeof r === "string" && EMAIL_RE.test(r)
      )
    : [];

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "At least one valid recipient is required." },
      { status: 400 }
    );
  }
  if (recipients.length > 25) {
    return NextResponse.json(
      { error: "Maximum 25 recipients per send." },
      { status: 400 }
    );
  }

  const note =
    typeof body.note === "string" ? body.note.slice(0, 1000) : "";

  const opts = body.options as Partial<ShareOptions> | undefined;
  const options: ShareOptions = {
    summary: opts?.summary ?? true,
    actionItems: opts?.actionItems ?? true,
    keyPoints: opts?.keyPoints ?? true,
    decisions: opts?.decisions ?? true,
  };
  if (!Object.values(options).some(Boolean)) {
    return NextResponse.json(
      { error: "Select at least one section to include." },
      { status: 400 }
    );
  }

  // Fetch meeting + notes, RLS ensures it belongs to the caller.
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select(
      "id, title, scheduled_at, duration_seconds, meeting_notes(summary, action_items, key_points, decisions)"
    )
    .eq("id", params.id)
    .single();

  if (meetingError || !meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const note0 = meeting.meeting_notes?.[0];
  if (!note0) {
    return NextResponse.json(
      { error: "This meeting has no notes yet." },
      { status: 400 }
    );
  }

  // Fetch sender display name
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const senderName =
    (profile?.full_name as string | null)?.trim() ||
    (profile?.email as string | null) ||
    user.email ||
    "Someone";

  const origin = new URL(request.url).origin;
  const meetingUrl = `${origin}/meetings/${meeting.id}`;

  const { subject, html, text } = renderMeetingEmail({
    meeting: {
      title: meeting.title,
      scheduled_at: meeting.scheduled_at,
      duration_seconds: meeting.duration_seconds ?? 0,
      summary: note0.summary ?? "",
      action_items: (note0.action_items as never) ?? [],
      key_points: (note0.key_points as string[]) ?? [],
      decisions: (note0.decisions as string[]) ?? [],
    },
    options,
    note,
    meetingUrl,
    senderName,
  });

  const resend = new Resend(RESEND_API_KEY);

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      replyTo: user.email ?? undefined,
      subject,
      html,
      text,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return NextResponse.json(
        { error: result.error.message ?? "Failed to send email" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, sent: recipients.length });
  } catch (err) {
    console.error("Resend send threw:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 502 }
    );
  }
}
