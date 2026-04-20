import type { TranscriptEntry } from "@/types/database";

// Hide generic placeholders like "Participant 1", "Speaker 2", "Unknown".
function isRealSpeaker(name: string | undefined): name is string {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (/^(participant|speaker|unknown)\s*\d*$/i.test(trimmed)) return false;
  return true;
}

export function TranscriptTab({ transcript }: { transcript: TranscriptEntry[] }) {
  if (transcript.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No transcript available
      </p>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {transcript.map((entry, i) => (
        <div key={i} className="flex gap-3">
          <span className="text-xs text-muted-foreground font-mono shrink-0 pt-0.5 w-16">
            [{entry.timestamp}]
          </span>
          <div className="flex-1">
            {isRealSpeaker(entry.speaker) && (
              <span className="text-sm font-medium mr-1.5">
                {entry.speaker}:
              </span>
            )}
            <span className="text-sm text-muted-foreground">{entry.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
