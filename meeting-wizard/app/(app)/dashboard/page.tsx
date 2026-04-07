import { createClient } from "@/lib/supabase/server";
import { getStats, getUpcomingMeetings, getCompletedMeetings } from "@/lib/queries";
import { getUpcomingCalendarEvents } from "@/lib/google-calendar";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UpcomingMeetings } from "@/components/dashboard/upcoming-meetings";
import { RecentNotesTable } from "@/components/dashboard/recent-notes-table";
import { QuickAddMeeting } from "@/components/dashboard/quick-add-meeting";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [stats, upcoming, completed, calendarEvents] = await Promise.all([
    getStats(supabase),
    getUpcomingMeetings(supabase),
    getCompletedMeetings(supabase),
    user ? getUpcomingCalendarEvents(supabase, user.id) : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your meeting overview at a glance."
      />
      <StatsCards stats={stats} />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentNotesTable meetings={completed} />
        </div>
        <div className="space-y-6">
          <QuickAddMeeting />
          <UpcomingMeetings meetings={upcoming} calendarEvents={calendarEvents} />
        </div>
      </div>
    </div>
  );
}
