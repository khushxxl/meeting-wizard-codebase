import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MeetingStatusBadge } from "@/components/meetings/meeting-status-badge";
import type { Meeting } from "@/lib/queries";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { formatDuration } from "@/lib/utils";

export function RecentNotesTable({ meetings }: { meetings: Meeting[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Recent Notes</CardTitle>
        <Link href="/meetings" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No meeting notes yet
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meeting</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Duration</TableHead>
                <TableHead className="hidden lg:table-cell">Participants</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((meeting) => (
                <TableRow key={meeting.id} className="cursor-pointer">
                  <TableCell>
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate max-w-[200px]">
                        {meeting.title}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {format(new Date(meeting.scheduled_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {formatDuration(meeting.duration_seconds)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {meeting.participants?.length ?? 0} people
                  </TableCell>
                  <TableCell>
                    <MeetingStatusBadge status={meeting.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
