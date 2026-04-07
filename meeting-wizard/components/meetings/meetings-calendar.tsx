"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingStatusBadge } from "./meeting-status-badge";
import type { Meeting } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function MeetingsCalendar({ meetings }: { meetings: Meeting[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const meetingsByDate = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    meetings.forEach((m) => {
      const key = format(new Date(m.scheduled_at), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return map;
  }, [meetings]);

  const selectedMeetings = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return meetingsByDate.get(key) || [];
  }, [selectedDate, meetingsByDate]);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-4">
      <div className="border rounded-lg bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDate(new Date());
              }}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {weekDays.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayMeetings = meetingsByDate.get(key) || [];
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const selected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative flex flex-col items-center py-2 rounded-lg text-sm transition-colors",
                  !inMonth && "text-muted-foreground/40",
                  inMonth && "hover:bg-accent",
                  selected && "bg-primary/10 ring-1 ring-primary",
                  today && !selected && "font-bold"
                )}
              >
                <span
                  className={cn(
                    "h-7 w-7 flex items-center justify-center rounded-full",
                    today && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayMeetings.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {dayMeetings.slice(0, 3).map((m) => (
                      <span
                        key={m.id}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          m.status === "ready"
                            ? "bg-green-500"
                            : m.status === "failed"
                            ? "bg-red-500"
                            : m.status === "scheduled"
                            ? "bg-gray-400"
                            : "bg-orange-400"
                        )}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-sm font-semibold">
              {format(selectedDate, "EEEE, MMMM d")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {selectedMeetings.length === 0
                ? "No meetings"
                : `${selectedMeetings.length} meeting${selectedMeetings.length > 1 ? "s" : ""}`}
            </p>
          </div>
          {selectedMeetings.length > 0 ? (
            <div className="divide-y divide-border">
              {selectedMeetings.map((m) => (
                <Link
                  key={m.id}
                  href={`/meetings/${m.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(m.scheduled_at), "h:mm a")} ·{" "}
                      {Math.round(m.duration_seconds / 60)} min ·{" "}
                      {m.participants?.length ?? 0} participants
                    </p>
                  </div>
                  <MeetingStatusBadge status={m.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No meetings on this day
            </div>
          )}
        </div>
      )}
    </div>
  );
}
