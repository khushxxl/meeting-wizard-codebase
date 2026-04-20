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

export async function structureTranscript(
  transcript: string
): Promise<StructuredNotes> {
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
    throw new Error(`OpenAI chat error: ${err}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  const cleaned = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function transcribeAudio(
  audio: Blob,
  filename = "recording.webm"
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
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Whisper error: ${err}`);
  }

  return (await response.text()).trim();
}
