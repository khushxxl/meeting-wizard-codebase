import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(totalSeconds: number) {
  if (!totalSeconds || totalSeconds <= 0) return "0 sec";
  if (totalSeconds < 60) return `${Math.round(totalSeconds)} sec`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = totalSeconds / 60;
  if (hours >= 1) {
    const remMins = Math.round((totalSeconds % 3600) / 60);
    return remMins ? `${hours} hr ${remMins} min` : `${hours} hr`;
  }
  const rounded = Math.round(minutes * 10) / 10;
  return Number.isInteger(rounded)
    ? `${rounded} min`
    : `${rounded.toFixed(1)} min`;
}
