"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  Link2,
  Sparkles,
  X,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChatDrawer, type ChatMessage } from "@/components/chat/chat-drawer";

interface ProcessResult {
  meetingId: string;
  title: string;
  actionItemsCount: number;
  keyPointsCount: number;
}

export function BottomDock({
  sidebarOpen,
  userId,
}: {
  sidebarOpen: boolean;
  userId: string;
}) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<
    "idle" | "processing" | "done" | "error"
  >("idle");
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [pendingChatMessage, setPendingChatMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const openChatWithQuery = (initial: string) => {
    setPendingChatMessage(initial);
    setChatOpen(true);
    setActivePanel(null);
    setAiQuery("");
  };

  const handleAskAiClick = () => {
    if (chatOpen) {
      setChatOpen(false);
      return;
    }
    togglePanel("ai");
  };

  const togglePanel = (panel: string) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = (e) => setTranscript((e.target?.result as string) ?? "");
    reader.readAsText(f);
  }, []);

  const clearFile = () => {
    setFile(null);
    setTranscript("");
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleProcess = async () => {
    if (!transcript.trim()) return;
    setStatus("processing");
    setErrorMsg("");

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Processing failed");
      }

      const data: ProcessResult = await res.json();
      setResult(data);
      setStatus("done");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Processing failed");
      setStatus("error");
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  return (
    <div
      className="fixed bottom-6 z-50 flex flex-col items-center gap-2"
      style={{
        left: `calc((100% + ${sidebarOpen ? "240px" : "64px"}) / 2)`,
        transform: "translateX(-50%)",
      }}
    >
      {/* Expanded panel */}
      {activePanel && (
        <div className="w-[420px] max-w-[90vw] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              {activePanel === "upload" && "Upload Transcript"}
              {activePanel === "link" && "Quick Add Meeting"}
              {activePanel === "ai" && "Ask AI"}
            </h3>
            <button
              onClick={() => setActivePanel(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {activePanel === "upload" && (
            <div className="space-y-3">
              {!file ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/40 p-5 cursor-pointer transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drop transcript or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    .txt, .md, .vtt, .srt
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".txt,.md,.vtt,.srt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-accent/50 border border-border">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {status === "idle" && (
                      <button
                        onClick={clearFile}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {transcript && status === "idle" && (
                    <div className="rounded-lg border bg-muted/30 p-2.5 max-h-24 overflow-y-auto">
                      <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                        {transcript.slice(0, 300)}
                        {transcript.length > 300 && "..."}
                      </p>
                    </div>
                  )}

                  {status === "idle" && (
                    <Button
                      onClick={handleProcess}
                      size="sm"
                      className="w-full gap-2"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate Notes with AI
                    </Button>
                  )}

                  {status === "processing" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <div>
                          <p className="text-sm font-medium">
                            AI is processing...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Extracting summary, action items & key points
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary h-full rounded-full animate-pulse w-2/3" />
                      </div>
                    </div>
                  )}

                  {status === "error" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                        <p className="text-sm text-red-900 dark:text-red-200">{errorMsg}</p>
                      </div>
                      <Button
                        onClick={handleProcess}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {status === "done" && result && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                        <div>
                          <p className="text-sm text-green-900 dark:text-green-200 font-medium">
                            Notes generated
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            {result.title}: {result.actionItemsCount} action
                            items, {result.keyPointsCount} key points
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            router.push(`/meetings/${result.meetingId}`);
                            setActivePanel(null);
                          }}
                        >
                          View Notes
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={clearFile}
                        >
                          Upload Another
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activePanel === "link" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!meetLink.trim()) return;
                const supabase = createClient();
                const { error } = await supabase.from("meetings").insert({
                  user_id: userId,
                  title: "Manual Meeting",
                  scheduled_at: new Date().toISOString(),
                  google_meet_link: meetLink.trim(),
                  status: "scheduled",
                });
                if (!error) {
                  setMeetLink("");
                  setActivePanel(null);
                  router.refresh();
                }
              }}
              className="flex gap-2"
            >
              <input
                type="url"
                placeholder="Paste a Google Meet link..."
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" size="sm">
                Add
              </Button>
            </form>
          )}

          {activePanel === "ai" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!aiQuery.trim()) return;
                openChatWithQuery(aiQuery.trim());
              }}
              className="space-y-3"
            >
              <input
                autoFocus
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask about your meetings..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground text-center">
                Press Enter to open chat. e.g. &quot;What were the action items from last week?&quot;
              </p>
            </form>
          )}
        </div>
      )}

      {/* Dock bar */}
      <div className="flex items-center gap-0 bg-card/90 backdrop-blur-xl border border-border rounded-full shadow-lg px-2 py-1.5">
        <DockItem
          icon={Upload}
          label="Upload"
          active={activePanel === "upload"}
          onClick={() => togglePanel("upload")}
        />
        <div className="w-px h-6 bg-border mx-1" />
        <DockItem
          icon={Link2}
          label="Quick Add"
          active={activePanel === "link"}
          onClick={() => togglePanel("link")}
        />
        <div className="w-px h-6 bg-border mx-1" />
        <DockItem
          icon={Sparkles}
          label="Ask AI"
          active={activePanel === "ai" || chatOpen}
          onClick={handleAskAiClick}
        />
      </div>
      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        setMessages={setChatMessages}
        pendingMessage={pendingChatMessage}
        onPendingConsumed={() => setPendingChatMessage(null)}
      />
    </div>
  );
}

function DockItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <div
        className={cn(
          "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
          active ? "bg-primary-foreground/20" : "bg-muted"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      {label}
    </button>
  );
}
