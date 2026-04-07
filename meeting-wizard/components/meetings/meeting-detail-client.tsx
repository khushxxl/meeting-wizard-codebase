"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeetingMetadataCard } from "@/components/meetings/meeting-metadata-card";
import { SummaryTab } from "@/components/meetings/summary-tab";
import { TranscriptTab } from "@/components/meetings/transcript-tab";
import { ActionItemsTab } from "@/components/meetings/action-items-tab";
import { KeyPointsTab } from "@/components/meetings/key-points-tab";
import { ExportButton } from "@/components/meetings/export-button";
import { MeetingStatusBadge } from "@/components/meetings/meeting-status-badge";
import type { Meeting, MeetingNote } from "@/lib/queries";
import { ArrowLeft, FileText } from "lucide-react";

export function MeetingDetailClient({
  meeting,
  notes,
}: {
  meeting: Meeting;
  notes: MeetingNote | null;
}) {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/meetings")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl tracking-tight truncate">
              {meeting.title}
            </h2>
            <MeetingStatusBadge status={meeting.status} />
          </div>
        </div>
        {notes && <ExportButton meeting={meeting} notes={notes} />}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {notes ? (
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="summary">
                  <TabsList className="mb-4">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    <TabsTrigger value="actions">
                      Action Items
                      {notes.action_items.length > 0 && (
                        <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                          {notes.action_items.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="keypoints">Key Points</TabsTrigger>
                  </TabsList>
                  <TabsContent value="summary">
                    <SummaryTab summary={notes.summary} />
                  </TabsContent>
                  <TabsContent value="transcript">
                    <TranscriptTab transcript={notes.transcript} />
                  </TabsContent>
                  <TabsContent value="actions">
                    <ActionItemsTab items={notes.action_items} noteId={notes.id} />
                  </TabsContent>
                  <TabsContent value="keypoints">
                    <KeyPointsTab
                      keyPoints={notes.key_points}
                      decisions={notes.decisions}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-1">
                  No notes available
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {meeting.status === "scheduled"
                    ? "Notes will be generated after the meeting is recorded and processed."
                    : meeting.status === "failed"
                    ? "The meeting recording failed. Notes could not be generated."
                    : "Notes are being processed. Check back shortly."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        <div>
          <MeetingMetadataCard meeting={meeting} />
        </div>
      </div>
    </div>
  );
}
