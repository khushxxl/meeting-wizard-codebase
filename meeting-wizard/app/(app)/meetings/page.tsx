import { createClient } from "@/lib/supabase/server";
import { getMeetings } from "@/lib/queries";
import { MeetingsPageClient } from "@/components/meetings/meetings-page-client";

export default async function MeetingsPage() {
  const supabase = await createClient();
  const meetings = await getMeetings(supabase);

  return <MeetingsPageClient meetings={meetings} />;
}
