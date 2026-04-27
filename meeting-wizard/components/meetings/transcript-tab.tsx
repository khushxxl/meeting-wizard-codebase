"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Trash2, Check, X, Loader2 } from "lucide-react";
import type { TranscriptEntry } from "@/types/database";

function isRealSpeaker(name: string | undefined): name is string {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (/^(participant|speaker|unknown)\s*\d*$/i.test(trimmed)) return false;
  return true;
}

export function TranscriptTab({
  transcript: initial,
  meetingId,
}: {
  transcript: TranscriptEntry[];
  meetingId: string;
}) {
  const [transcript, setTranscript] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TranscriptEntry[]>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const cleaned = draft
        .map((e) => ({
          timestamp: e.timestamp.trim(),
          speaker: e.speaker.trim(),
          text: e.text.trim(),
        }))
        .filter((e) => e.text);
      const res = await fetch(`/api/meetings/${meetingId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: cleaned }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      setTranscript(cleaned);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function updateEntry(i: number, patch: Partial<TranscriptEntry>) {
    setDraft((d) => d.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  function deleteEntry(i: number) {
    setDraft((d) => d.filter((_, idx) => idx !== i));
  }

  function addEntry() {
    setDraft((d) => [...d, { timestamp: "00:00", speaker: "", text: "" }]);
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {draft.map((entry, i) => (
            <div
              key={i}
              className="flex gap-2 items-start p-2 rounded-md border border-border"
            >
              <Input
                value={entry.timestamp}
                onChange={(e) => updateEntry(i, { timestamp: e.target.value })}
                className="w-20 font-mono text-xs"
                placeholder="00:00"
              />
              <Input
                value={entry.speaker}
                onChange={(e) => updateEntry(i, { speaker: e.target.value })}
                className="w-32 text-xs"
                placeholder="Speaker"
              />
              <textarea
                value={entry.text}
                onChange={(e) => updateEntry(i, { text: e.target.value })}
                rows={2}
                className="flex-1 resize-none rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                placeholder="What was said..."
              />
              <button
                onClick={() => deleteEntry(i)}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addEntry} className="w-full">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add line
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft(transcript);
              setEditing(false);
              setError("");
            }}
            disabled={saving}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDraft(transcript);
            setEditing(true);
          }}
        >
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
      </div>
      {transcript.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No transcript available
        </p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                <span className="text-sm text-muted-foreground">
                  {entry.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
