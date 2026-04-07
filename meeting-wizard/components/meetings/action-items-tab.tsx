"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { ActionItem } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ActionItemsTab({
  items: initialItems,
  noteId,
}: {
  items: ActionItem[];
  noteId: string;
}) {
  const [items, setItems] = useState(initialItems);

  const toggleItem = async (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(updated);

    // Optimistic update — persist to DB
    const supabase = createClient();
    await supabase
      .from("meeting_notes")
      .update({ action_items: updated as unknown as ActionItem[] })
      .eq("id", noteId);
  };

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No action items
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
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
              <span className="text-xs text-muted-foreground">
                {item.owner}
              </span>
              {item.due_date && (
                <span className="text-xs text-muted-foreground">
                  Due: {item.due_date}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
