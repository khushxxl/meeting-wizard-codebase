import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const SYSTEM_PROMPT = `You are a meeting notes assistant. Given a meeting transcript, produce structured notes in JSON format.

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
- Return ONLY the JSON, no markdown fences or extra text`;

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify auth
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

  try {
    // Call OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Process this meeting transcript:\n\n${transcript.slice(0, 30000)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", err);
      return NextResponse.json(
        { error: "AI processing failed" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // Parse the JSON response
    let notes;
    try {
      // Strip markdown fences if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      notes = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Create a meeting record
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
      return NextResponse.json(
        { error: "Failed to save meeting" },
        { status: 500 }
      );
    }

    // Create meeting notes
    const { error: notesError } = await supabase
      .from("meeting_notes")
      .insert({
        meeting_id: meeting.id,
        summary: notes.summary || "",
        transcript: notes.transcript || [],
        action_items: notes.action_items || [],
        key_points: notes.key_points || [],
        decisions: notes.decisions || [],
      });

    if (notesError) {
      console.error("Notes insert error:", notesError);
      return NextResponse.json(
        { error: "Failed to save notes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      meetingId: meeting.id,
      title: notes.title,
      actionItemsCount: notes.action_items?.length || 0,
      keyPointsCount: notes.key_points?.length || 0,
    });
  } catch (err) {
    console.error("Process error:", err);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}
