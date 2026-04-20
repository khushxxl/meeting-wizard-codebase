import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-keys";
import { structureTranscript, transcribeAudio } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, init: ResponseInit = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...corsHeaders, ...(init.headers ?? {}) },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  const auth = await verifyApiKey(request.headers.get("authorization"));
  if (!auth) return json({ error: "Invalid API key" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("audio");
  if (!(file instanceof Blob) || file.size === 0) {
    return json({ error: "Audio file is required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return json({ error: "File exceeds 100 MB limit" }, { status: 413 });
  }

  const recordedAtRaw = form?.get("recorded_at");
  const durationRaw = form?.get("duration_seconds");
  const recordedAt =
    typeof recordedAtRaw === "string" && recordedAtRaw
      ? new Date(recordedAtRaw).toISOString()
      : new Date().toISOString();
  const duration =
    typeof durationRaw === "string" ? parseInt(durationRaw, 10) || 0 : 0;

  const admin = createAdminClient();

  const { data: meeting, error: meetingError } = await admin
    .from("meetings")
    .insert({
      user_id: auth.userId,
      title: "Processing recording...",
      scheduled_at: recordedAt,
      duration_seconds: duration,
      google_meet_link: "",
      status: "processing",
      participants: [],
    })
    .select("id")
    .single();

  if (meetingError || !meeting) {
    console.error("Meeting insert error:", meetingError);
    return json({ error: "Failed to create meeting" }, { status: 500 });
  }

  const objectPath = `${auth.userId}/${meeting.id}.webm`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("recordings")
    .upload(objectPath, bytes, {
      contentType: file.type || "audio/webm",
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    await admin.from("meetings").update({ status: "failed" }).eq("id", meeting.id);
    return json({ error: "Failed to store recording" }, { status: 500 });
  }

  await admin
    .from("meetings")
    .update({ audio_url: objectPath })
    .eq("id", meeting.id);

  // Transcribe + structure. On failure, mark the meeting failed but keep the audio.
  try {
    const transcript = await transcribeAudio(file, "recording.webm");
    if (!transcript) throw new Error("Empty transcript");

    const notes = await structureTranscript(transcript);

    await admin
      .from("meetings")
      .update({
        title: notes.title || "Recorded Meeting",
        duration_seconds: duration || (notes.duration_minutes || 30) * 60,
        participants: notes.participants || [],
        status: "ready",
      })
      .eq("id", meeting.id);

    const { error: notesError } = await admin.from("meeting_notes").insert({
      meeting_id: meeting.id,
      summary: notes.summary || "",
      transcript: notes.transcript || [],
      action_items: notes.action_items || [],
      key_points: notes.key_points || [],
      decisions: notes.decisions || [],
      raw_transcript: transcript,
    });
    if (notesError) throw notesError;
  } catch (err) {
    console.error("Processing error:", err);
    await admin
      .from("meetings")
      .update({ status: "failed" })
      .eq("id", meeting.id);
    return json(
      { error: "Transcription or AI processing failed", meetingId: meeting.id },
      { status: 500 }
    );
  }

  return json({ meetingId: meeting.id, status: "ready" });
}
