"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionItem } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Plus, Check, X, Loader2 } from "lucide-react";

export function ActionItemsTab({
  items: initialItems,
  noteId,
}: {
  items: ActionItem[];
  noteId: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActionItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState<Omit<ActionItem, "id">>({
    text: "",
    owner: "",
    completed: false,
    due_date: "",
  });
  const [saving, setSaving] = useState(false);

  async function persist(next: ActionItem[]) {
    setItems(next);
    const supabase = createClient();
    await supabase
      .from("meeting_notes")
      .update({ action_items: next as unknown as ActionItem[] })
      .eq("id", noteId);
  }

  async function toggleItem(id: string) {
    const next = items.map((i) =>
      i.id === id ? { ...i, completed: !i.completed } : i
    );
    await persist(next);
  }

  async function deleteItem(id: string) {
    await persist(items.filter((i) => i.id !== id));
  }

  function startEdit(item: ActionItem) {
    setEditingId(item.id);
    setDraft({ ...item });
  }

  async function saveEdit() {
    if (!draft) return;
    setSaving(true);
    const next = items.map((i) => (i.id === draft.id ? draft : i));
    await persist(next);
    setEditingId(null);
    setDraft(null);
    setSaving(false);
  }

  async function saveNew() {
    if (!newItem.text.trim()) return;
    setSaving(true);
    const item: ActionItem = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text: newItem.text.trim(),
      owner: newItem.owner.trim(),
      completed: false,
      due_date: newItem.due_date?.trim() || undefined,
    };
    await persist([...items, item]);
    setNewItem({ text: "", owner: "", completed: false, due_date: "" });
    setAdding(false);
    setSaving(false);
  }

  return (
    <div className="space-y-2">
      {items.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No action items yet
        </p>
      )}

      {items.map((item) => {
        const isEditing = editingId === item.id;
        if (isEditing && draft) {
          return (
            <div
              key={item.id}
              className="space-y-2 p-3 rounded-lg border border-primary/40 bg-accent/20"
            >
              <Input
                value={draft.text}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                placeholder="What needs to be done?"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={draft.owner}
                  onChange={(e) =>
                    setDraft({ ...draft, owner: e.target.value })
                  }
                  placeholder="Owner"
                />
                <Input
                  value={draft.due_date ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, due_date: e.target.value })
                  }
                  placeholder="Due date (optional)"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingId(null);
                    setDraft(null);
                  }}
                  disabled={saving}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={saveEdit} disabled={saving || !draft.text.trim()}>
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
          <div
            key={item.id}
            className="group flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
          >
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => toggleItem(item.id)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm",
                  item.completed && "line-through text-muted-foreground"
                )}
              >
                {item.text}
              </p>
              <div className="flex items-center gap-3 mt-1">
                {item.owner && (
                  <span className="text-xs text-muted-foreground">
                    {item.owner}
                  </span>
                )}
                {item.due_date && (
                  <span className="text-xs text-muted-foreground">
                    Due: {item.due_date}
                  </span>
                )}
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={() => startEdit(item)}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => deleteItem(item.id)}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}

      {adding ? (
        <div className="space-y-2 p-3 rounded-lg border border-primary/40 bg-accent/20">
          <Input
            autoFocus
            value={newItem.text}
            onChange={(e) => setNewItem({ ...newItem, text: e.target.value })}
            placeholder="What needs to be done?"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={newItem.owner}
              onChange={(e) =>
                setNewItem({ ...newItem, owner: e.target.value })
              }
              placeholder="Owner"
            />
            <Input
              value={newItem.due_date ?? ""}
              onChange={(e) =>
                setNewItem({ ...newItem, due_date: e.target.value })
              }
              placeholder="Due date (optional)"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false);
                setNewItem({
                  text: "",
                  owner: "",
                  completed: false,
                  due_date: "",
                });
              }}
              disabled={saving}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={saveNew}
              disabled={saving || !newItem.text.trim()}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1" />
              )}
              Add
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAdding(true)}
          className="w-full mt-2"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add action item
        </Button>
      )}
    </div>
  );
}
