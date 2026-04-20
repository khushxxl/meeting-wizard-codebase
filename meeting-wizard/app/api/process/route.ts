import { createClient } from "@/lib/supabase/server";
import { structureTranscript } from "@/lib/openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transcript } = await request.json();
  if (!transcript || typeof transcript !== "string") {
    return NextResponse.json(
      { error: "Transcript is required" },
      { status: 400 }
    );
  }

  let notes;
  try {
    notes = await structureTranscript(transcript);
  } catch (err) {
    console.error("AI processing failed:", err);
    return NextResponse.json({ error: "AI processing failed" }, { status: 500 });
  }

  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .insert({
      user_id: user.id,
      title: notes.title || "Uploaded Meeting",
      scheduled_at: new Date().toISOString(),
      duration_seconds: (notes.duration_minutes || 30) * 60,
      google_meet_link: "",
      status: "ready",
      participants: notes.participants || [],
    })
    .select("id")
    .single();

  if (meetingError) {
    console.error("Meeting insert error:", meetingError);
    return NextResponse.json({ error: "Failed to save meeting" }, { status: 500 });
  }

  const { error: notesError } = await supabase.from("meeting_notes").insert({
    meeting_id: meeting.id,
    summary: notes.summary || "",
    transcript: notes.transcript || [],
    action_items: notes.action_items || [],
    key_points: notes.key_points || [],
    decisions: notes.decisions || [],
    raw_transcript: transcript,
  });

  if (notesError) {
    console.error("Notes insert error:", notesError);
    return NextResponse.json({ error: "Failed to save notes" }, { status: 500 });
  }

  return NextResponse.json({
    meetingId: meeting.id,
    title: notes.title,
    actionItemsCount: notes.action_items?.length || 0,
    keyPointsCount: notes.key_points?.length || 0,
  });
}
