"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { MeetingsTable } from "@/components/meetings/meetings-table";
import { MeetingsCalendar } from "@/components/meetings/meetings-calendar";
import { Button } from "@/components/ui/button";
import { List, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Meeting } from "@/lib/queries";

export function MeetingsPageClient({ meetings }: { meetings: Meeting[] }) {
  const [view, setView] = useState<"list" | "calendar">("list");

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Meetings"
        description="All your meetings and notes in one place."
        action={
          <div
            data-tour-id="meetings-view-toggle"
            className="flex items-center gap-1 bg-muted p-1 rounded-lg"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("list")}
              className={cn(
                "h-8 px-3 rounded-md gap-1.5",
                view === "list"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("calendar")}
              className={cn(
                "h-8 px-3 rounded-md gap-1.5",
                view === "calendar"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </Button>
          </div>
        }
      />
      <div data-tour-id="meetings-list">
        {view === "list" ? (
          <MeetingsTable meetings={meetings} />
        ) : (
          <MeetingsCalendar meetings={meetings} />
        )}
      </div>
    </div>
  );
}
