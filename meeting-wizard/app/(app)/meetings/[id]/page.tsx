import { createClient } from "@/lib/supabase/server";
import { getMeeting } from "@/lib/queries";
import { notFound } from "next/navigation";
import { MeetingDetailClient } from "@/components/meetings/meeting-detail-client";

export default async function MeetingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const meeting = await getMeeting(supabase, params.id);

  if (!meeting) {
    notFound();
  }

  const notes = meeting.meeting_notes?.[0] ?? null;

  let audioSrc: string | null = null;
  if (meeting.audio_url) {
    const { data } = await supabase.storage
      .from("recordings")
      .createSignedUrl(meeting.audio_url, 60 * 60);
    audioSrc = data?.signedUrl ?? null;
  }

  return (
    <MeetingDetailClient meeting={meeting} notes={notes} audioSrc={audioSrc} />
  );
}
