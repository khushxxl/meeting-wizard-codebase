import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";
import type { MeetingStatus } from "@/types/database";

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.color
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          config.dotColor,
          status === "processing" && "animate-pulse"
        )}
      />
      {config.label}
    </span>
  );
}
