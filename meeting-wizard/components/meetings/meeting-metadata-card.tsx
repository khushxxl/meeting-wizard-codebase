import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MeetingStatusBadge } from "./meeting-status-badge";
import type { Meeting } from "@/lib/queries";
import { format } from "date-fns";
import { Calendar, Clock, Users, Video } from "lucide-react";

export function MeetingMetadataCard({ meeting }: { meeting: Meeting }) {
  const participants = meeting.participants ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Meeting Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm">
              {format(new Date(meeting.scheduled_at), "EEEE, MMMM d, yyyy")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(meeting.scheduled_at), "h:mm a")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm">
            {Math.round(meeting.duration_seconds / 60)} minutes
          </p>
        </div>
        {meeting.google_meet_link && (
          <div className="flex items-center gap-3">
            <Video className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-primary truncate">
              {meeting.google_meet_link.replace("https://", "")}
            </p>
          </div>
        )}
        <Separator />
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">
              Participants ({participants.length})
            </p>
          </div>
          {participants.length > 0 ? (
            <div className="space-y-1.5">
              {participants.map((p) => (
                <div key={p.email} className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-primary">
                      {p.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No participants</p>
          )}
        </div>
        <Separator />
        <div>
          <p className="text-xs text-muted-foreground mb-2">Status</p>
          <MeetingStatusBadge status={meeting.status} />
        </div>
      </CardContent>
    </Card>
  );
}
