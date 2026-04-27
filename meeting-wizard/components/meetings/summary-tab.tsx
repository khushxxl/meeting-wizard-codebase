"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X, Loader2 } from "lucide-react";

export function SummaryTab({
  summary: initial,
  meetingId,
}: {
  summary: string;
  meetingId: string;
}) {
  const [summary, setSummary] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/meetings/${meetingId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: draft }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      setSummary(draft);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={10}
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft(summary);
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
    <div className="group relative">
      <div className="prose prose-sm max-w-none">
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
          {summary || (
            <span className="text-muted-foreground italic">No summary yet.</span>
          )}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setDraft(summary);
          setEditing(true);
        }}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil className="h-3.5 w-3.5 mr-1" />
        Edit
      </Button>
    </div>
  );
}
