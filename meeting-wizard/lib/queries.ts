import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MeetingStatus, Participant, TranscriptEntry, ActionItem } from "@/types/database";

type Client = SupabaseClient<Database>;

// ─── Meeting types for the app ───────────────────────────────

export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  scheduled_at: string;
  duration_seconds: number;
  google_meet_link: string;
  status: MeetingStatus;
  participants: Participant[];
  audio_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingNote {
  id: string;
  meeting_id: string;
  summary: string;
  transcript: TranscriptEntry[];
  action_items: ActionItem[];
  key_points: string[];
  decisions: string[];
  created_at: string;
}

export interface MeetingWithNotes extends Meeting {
  meeting_notes: MeetingNote[];
}

// ─── User queries ────────────────────────────────────────────

export async function getUserProfile(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function updateUserProfile(
  supabase: Client,
  userId: string,
  updates: Database["public"]["Tables"]["users"]["Update"]
) {
  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId);
  return { error };
}

// ─── Meeting queries ─────────────────────────────────────────

export async function getMeetings(supabase: Client) {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .order("scheduled_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Meeting[];
}

export async function getMeeting(supabase: Client, id: string) {
  const { data, error } = await supabase
    .from("meetings")
    .select("*, meeting_notes(*)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as MeetingWithNotes | null;
}

export async function getUpcomingMeetings(supabase: Client) {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(5);
  if (error) return [];
  return (data ?? []) as Meeting[];
}

export async function getCompletedMeetings(supabase: Client) {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("status", "ready")
    .order("scheduled_at", { ascending: false })
    .limit(10);
  if (error) return [];
  return (data ?? []) as Meeting[];
}

export async function createMeeting(
  supabase: Client,
  meeting: Database["public"]["Tables"]["meetings"]["Insert"]
) {
  const { data, error } = await supabase
    .from("meetings")
    .insert(meeting)
    .select()
    .single();
  return { data, error };
}

export async function updateMeeting(
  supabase: Client,
  id: string,
  updates: Database["public"]["Tables"]["meetings"]["Update"]
) {
  const { error } = await supabase
    .from("meetings")
    .update(updates)
    .eq("id", id);
  return { error };
}

// ─── Notes queries ───────────────────────────────────────────

export async function updateActionItems(
  supabase: Client,
  noteId: string,
  actionItems: ActionItem[]
) {
  const { error } = await supabase
    .from("meeting_notes")
    .update({ action_items: actionItems as unknown as Database["public"]["Tables"]["meeting_notes"]["Update"]["action_items"] })
    .eq("id", noteId);
  return { error };
}

// ─── Stats ───────────────────────────────────────────────────

export async function getStats(supabase: Client) {
  const [meetingsRes, notesRes] = await Promise.all([
    supabase.from("meetings").select("id, status, duration_seconds, scheduled_at"),
    supabase.from("meeting_notes").select("action_items"),
  ]);

  const meetings = meetingsRes.data ?? [];
  const notes = notesRes.data ?? [];

  const completed = meetings.filter((m) => m.status === "ready");
  const totalHours =
    completed.reduce((sum, m) => sum + (m.duration_seconds ?? 0), 0) / 3600;
  const totalActionItems = notes.reduce(
    (sum, n) => sum + ((n.action_items as ActionItem[])?.length ?? 0),
    0
  );
  const today = new Date().toDateString();
  const scheduledToday = meetings.filter(
    (m) =>
      m.status === "scheduled" &&
      new Date(m.scheduled_at).toDateString() === today
  ).length;

  return {
    totalMeetings: completed.length,
    totalHours: Math.round(totalHours * 10) / 10,
    totalActionItems,
    scheduledToday,
  };
}
