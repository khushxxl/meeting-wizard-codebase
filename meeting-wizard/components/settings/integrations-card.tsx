"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Video, MessageSquare, RefreshCw, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface IntegrationsCardProps {
  calendarConnected: boolean;
  userId: string;
}

export function IntegrationsCard({ calendarConnected, userId }: IntegrationsCardProps) {
  const [connected, setConnected] = useState(calendarConnected);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleConnect = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
        scopes: "https://www.googleapis.com/auth/calendar.events.readonly",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  const handleDisconnect = async () => {
    const supabase = createClient();
    await supabase
      .from("users")
      .update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expires_at: null,
        google_calendar_connected: false,
      })
      .eq("id", userId);
    setConnected(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setSyncResult("Sync failed. Try reconnecting.");
      } else {
        setSyncResult(`Found ${data.count} upcoming meeting${data.count === 1 ? "" : "s"}`);
      }
    } catch {
      setSyncResult("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Integrations</CardTitle>
        <CardDescription>Connect your tools and services.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Google Calendar</p>
                {connected && (
                  <Badge variant="secondary" className="text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40">
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {connected
                  ? syncResult ?? "Calendar events sync automatically"
                  : "Import upcoming meetings from your calendar"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connected && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
                Sync
              </Button>
            )}
            <Button
              variant={connected ? "outline" : "default"}
              size="sm"
              onClick={connected ? handleDisconnect : handleConnect}
            >
              {connected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border opacity-60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              <Video className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Zoom</p>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </div>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border opacity-60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Microsoft Teams</p>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </div>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
