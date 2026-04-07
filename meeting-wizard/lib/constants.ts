import type { MeetingStatus } from "@/types/database";

export const STATUS_CONFIG: Record<
  MeetingStatus,
  { label: string; color: string; dotColor: string }
> = {
  scheduled: {
    label: "Scheduled",
    color: "bg-secondary text-secondary-foreground",
    dotColor: "bg-gray-400",
  },
  joining: {
    label: "Joining",
    color: "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300",
    dotColor: "bg-yellow-400",
  },
  recording: {
    label: "Recording",
    color: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300",
    dotColor: "bg-red-500",
  },
  processing: {
    label: "Processing",
    color: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300",
    dotColor: "bg-orange-400",
  },
  ready: {
    label: "Ready",
    color: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300",
    dotColor: "bg-green-500",
  },
  failed: {
    label: "Failed",
    color: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300",
    dotColor: "bg-red-500",
  },
};
