import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, CheckSquare, CalendarDays } from "lucide-react";

const icons = [Calendar, Clock, CheckSquare, CalendarDays];

interface Stats {
  totalMeetings: number;
  totalHours: number;
  totalActionItems: number;
  scheduledToday: number;
}

export function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Meetings Recorded", value: stats.totalMeetings },
    { label: "Hours Captured", value: `${stats.totalHours}h` },
    { label: "Action Items", value: stats.totalActionItems },
    { label: "Scheduled Today", value: stats.scheduledToday },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = icons[i];
        return (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
