import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ActionItem, TranscriptEntry } from "@/types/database";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    summary?: unknown;
    action_items?: unknown;
    transcript?: unknown;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Verify the meeting belongs to the caller (RLS would catch it, but get a clean 404).
  const { data: meeting, error: meetingErr } = await supabase
    .from("meetings")
    .select("id")
    .eq("id", params.id)
    .single();
  if (meetingErr || !meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};

  if (typeof body.summary === "string") {
    update.summary = body.summary.slice(0, 20000);
  }

  if (Array.isArray(body.action_items)) {
    const items = body.action_items
      .filter((i): i is ActionItem => {
        if (!i || typeof i !== "object") return false;
        const o = i as Record<string, unknown>;
        return (
          typeof o.id === "string" &&
          typeof o.text === "string" &&
          typeof o.owner === "string" &&
          typeof o.completed === "boolean"
        );
      })
      .slice(0, 200);
    update.action_items = items;
  }

  if (Array.isArray(body.transcript)) {
    const entries = body.transcript
      .filter((e): e is TranscriptEntry => {
        if (!e || typeof e !== "object") return false;
        const o = e as Record<string, unknown>;
        return (
          typeof o.timestamp === "string" &&
          typeof o.speaker === "string" &&
          typeof o.text === "string"
        );
      })
      .slice(0, 5000);
    update.transcript = entries;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("meeting_notes")
    .update(update)
    .eq("meeting_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
