"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingStatusBadge } from "@/components/meetings/meeting-status-badge";
import type { Meeting } from "@/lib/queries";
import type { CalendarEvent } from "@/lib/google-calendar";
import { format } from "date-fns";
import { Video, Users, CalendarX, Calendar } from "lucide-react";

interface UpcomingMeetingsProps {
  meetings: Meeting[];
  calendarEvents?: CalendarEvent[];
}

export function UpcomingMeetings({ meetings, calendarEvents = [] }: UpcomingMeetingsProps) {
  const hasItems = meetings.length > 0 || calendarEvents.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          Upcoming Meetings
        </CardTitle>
        <Link
          href="/meetings"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasItems ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CalendarX className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No upcoming meetings
            </p>
          </div>
        ) : (
          <>
            {/* Calendar events (from Google Calendar, not in DB) */}
            {calendarEvents.map((event) => (
              <div
                key={`cal-${event.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="space-y-1 min-w-0">
                  <p className="font-medium text-sm truncate">{event.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {format(
                        new Date(event.scheduled_at),
                        "EEE, MMM d, h:mm a"
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.participants.length}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <div className="h-6 w-6 rounded bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center" title="From Google Calendar">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  {event.google_meet_link && (
                    <a
                      href={event.google_meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-6 w-6 rounded bg-green-50 dark:bg-green-950/40 flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                      title="Join Google Meet"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Video className="h-3.5 w-3.5 text-green-600" />
                    </a>
                  )}
                </div>
              </div>
            ))}

            {/* DB meetings */}
            {meetings.map((meeting) => (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <p className="font-medium text-sm truncate">{meeting.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {format(
                        new Date(meeting.scheduled_at),
                        "EEE, MMM d, h:mm a"
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {meeting.participants?.length ?? 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {meeting.google_meet_link && (
                    <div className="h-6 w-6 rounded bg-green-50 dark:bg-green-950/40 flex items-center justify-center">
                      <Video className="h-3.5 w-3.5 text-green-600" />
                    </div>
                  )}
                  <MeetingStatusBadge status={meeting.status} />
                </div>
              </Link>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
