import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MeetingStatusBadge } from "./meeting-status-badge";
import type { Meeting } from "@/lib/queries";
import { format } from "date-fns";
import { Calendar, Clock, Video } from "lucide-react";
import { formatDuration } from "@/lib/utils";

export function MeetingMetadataCard({ meeting }: { meeting: Meeting }) {
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
          <p className="text-sm">{formatDuration(meeting.duration_seconds)}</p>
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
          <p className="text-xs text-muted-foreground mb-2">Status</p>
          <MeetingStatusBadge status={meeting.status} />
        </div>
      </CardContent>
    </Card>
  );
}
