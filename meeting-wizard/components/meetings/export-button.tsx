"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Copy, FileDown } from "lucide-react";
import type { Meeting, MeetingNote } from "@/lib/queries";
import { format } from "date-fns";

function toMarkdown(meeting: Meeting, notes: MeetingNote): string {
  const participants = meeting.participants ?? [];
  let md = `# ${meeting.title}\n\n`;
  md += `**Date:** ${format(new Date(meeting.scheduled_at), "MMMM d, yyyy h:mm a")}\n`;
  md += `**Duration:** ${Math.round(meeting.duration_seconds / 60)} minutes\n`;
  md += `**Participants:** ${participants.map((p) => p.name).join(", ")}\n\n`;

  md += `## Summary\n\n${notes.summary}\n\n`;

  if (notes.action_items.length > 0) {
    md += `## Action Items\n\n`;
    notes.action_items.forEach((item) => {
      md += `- [${item.completed ? "x" : " "}] ${item.text} (${item.owner})\n`;
    });
    md += "\n";
  }

  if (notes.key_points.length > 0) {
    md += `## Key Points\n\n`;
    notes.key_points.forEach((point) => {
      md += `- ${point}\n`;
    });
    md += "\n";
  }

  if (notes.decisions.length > 0) {
    md += `## Decisions\n\n`;
    notes.decisions.forEach((d) => {
      md += `- ${d}\n`;
    });
    md += "\n";
  }

  if (notes.transcript.length > 0) {
    md += `## Transcript\n\n`;
    notes.transcript.forEach((entry) => {
      md += `[${entry.timestamp}] **${entry.speaker}:** ${entry.text}\n\n`;
    });
  }

  return md;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({
  meeting,
  notes,
}: {
  meeting: Meeting;
  notes: MeetingNote;
}) {
  const filename = `${meeting.title.replace(/[^a-zA-Z0-9]/g, "-")}_${format(
    new Date(meeting.scheduled_at),
    "yyyy-MM-dd"
  )}`;

  const handleMarkdown = () => {
    const md = toMarkdown(meeting, notes);
    downloadFile(md, `${filename}.md`, "text/markdown");
  };

  const handlePlainText = () => {
    const md = toMarkdown(meeting, notes);
    downloadFile(md, `${filename}.txt`, "text/plain");
  };

  const handleCopy = async () => {
    const md = toMarkdown(meeting, notes);
    await navigator.clipboard.writeText(md);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 transition-colors">
        <Download className="h-4 w-4" />
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleMarkdown}>
          <FileDown className="h-4 w-4 mr-2" />
          Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePlainText}>
          <FileText className="h-4 w-4 mr-2" />
          Plain Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          Copy to Clipboard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
