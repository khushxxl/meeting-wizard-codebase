"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Send, Check, Loader2, X } from "lucide-react";

type Status = "idle" | "sending" | "sent" | "error";

interface Options {
  summary: boolean;
  actionItems: boolean;
  keyPoints: boolean;
  decisions: boolean;
}

export function ShareByEmailCard({
  meetingId,
  meetingTitle,
}: {
  meetingId: string;
  meetingTitle: string;
}) {
  const [recipients, setRecipients] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [options, setOptions] = useState<Options>({
    summary: true,
    actionItems: true,
    keyPoints: true,
    decisions: true,
  });

  const emails = recipients
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const validEmails = emails.filter((e) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
  );
  const invalidEmails = emails.filter((e) => !validEmails.includes(e));
  const canSend =
    validEmails.length > 0 &&
    invalidEmails.length === 0 &&
    Object.values(options).some(Boolean);

  function toggle(key: keyof Options) {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSend() {
    if (!canSend) return;
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/meetings/${meetingId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: validEmails,
          note,
          options,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setStatus("sent");
      setTimeout(() => {
        setStatus("idle");
        setRecipients("");
        setNote("");
      }, 2400);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to send.");
      setStatus("error");
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Share via email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">Recipients</label>
          <Input
            type="text"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="alice@acme.com, bob@acme.com"
            disabled={status === "sending" || status === "sent"}
          />
          {invalidEmails.length > 0 && (
            <p className="text-[11px] text-destructive mt-1">
              Invalid: {invalidEmails.join(", ")}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs text-muted-foreground">
            Personal note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`"Here are the notes from ${meetingTitle}..."`}
            rows={2}
            disabled={status === "sending" || status === "sent"}
            className="w-full mt-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none"
          />
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Include in email</p>
          <div className="grid grid-cols-2 gap-2">
            <OptionRow
              label="Summary"
              checked={options.summary}
              onCheck={() => toggle("summary")}
            />
            <OptionRow
              label="Action items"
              checked={options.actionItems}
              onCheck={() => toggle("actionItems")}
            />
            <OptionRow
              label="Key points"
              checked={options.keyPoints}
              onCheck={() => toggle("keyPoints")}
            />
            <OptionRow
              label="Decisions"
              checked={options.decisions}
              onCheck={() => toggle("decisions")}
            />
          </div>
        </div>

        {validEmails.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {validEmails.map((e) => (
              <span
                key={e}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px]"
              >
                {e}
                <button
                  type="button"
                  onClick={() =>
                    setRecipients(validEmails.filter((x) => x !== e).join(", "))
                  }
                  className="opacity-60 hover:opacity-100"
                  disabled={status === "sending" || status === "sent"}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {status === "error" && errorMsg && (
          <p className="text-[11px] text-destructive">{errorMsg}</p>
        )}

        <Button
          onClick={handleSend}
          disabled={!canSend || status === "sending" || status === "sent"}
          className="w-full rounded-full p-4"
          size="sm"
        >
          {status === "sending" && (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Sending...
            </>
          )}
          {status === "sent" && (
            <>
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Sent to {validEmails.length}
            </>
          )}
          {(status === "idle" || status === "error") && (
            <>
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {validEmails.length > 0
                ? `Send to ${validEmails.length}`
                : "Send"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function OptionRow({
  label,
  checked,
  onCheck,
}: {
  label: string;
  checked: boolean;
  onCheck: () => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
      <Checkbox checked={checked} onCheckedChange={onCheck} />
      <span>{label}</span>
    </label>
  );
}
