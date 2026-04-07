import { createClient } from "@/lib/supabase/server";
import { getUpcomingCalendarEvents } from "@/lib/google-calendar";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await getUpcomingCalendarEvents(supabase, user.id);
  return NextResponse.json({ events, count: events.length });
}
