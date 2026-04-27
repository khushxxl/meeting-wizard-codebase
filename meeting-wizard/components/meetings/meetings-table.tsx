"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MeetingStatusBadge } from "./meeting-status-badge";
import { MeetingFilters } from "./meeting-filters";
import type { Meeting } from "@/lib/queries";
import { format, isThisWeek, isThisMonth } from "date-fns";
import { Users, ChevronRight } from "lucide-react";
import { formatDuration } from "@/lib/utils";

export function MeetingsTable({ meetings }: { meetings: Meeting[] }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = [...meetings].sort(
      (a, b) =>
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    );

    if (filter === "week") {
      list = list.filter((m) => isThisWeek(new Date(m.scheduled_at)));
    } else if (filter === "month") {
      list = list.filter((m) => isThisMonth(new Date(m.scheduled_at)));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.title.toLowerCase().includes(q));
    }

    return list;
  }, [meetings, filter, search]);

  return (
    <div className="space-y-4">
      <MeetingFilters
        activeFilter={filter}
        onFilterChange={setFilter}
        searchQuery={search}
        onSearchChange={setSearch}
      />
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meeting</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="hidden md:table-cell">Duration</TableHead>
              <TableHead className="hidden lg:table-cell">Participants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No meetings found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((meeting) => (
                <TableRow key={meeting.id} className="group">
                  <TableCell>
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {meeting.title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {format(
                      new Date(meeting.scheduled_at),
                      "MMM d, yyyy · h:mm a"
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {formatDuration(meeting.duration_seconds)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {meeting.participants?.length ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <MeetingStatusBadge status={meeting.status} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/meetings/${meeting.id}`}>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
