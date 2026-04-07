"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

export function PreferencesForm({
  userId,
  autoJoinEnabled,
  emailNotifications,
  defaultExportFormat,
}: {
  userId: string;
  autoJoinEnabled: boolean;
  emailNotifications: boolean;
  defaultExportFormat: string;
}) {
  const [autoJoin, setAutoJoin] = useState(autoJoinEnabled);
  const [emailNotif, setEmailNotif] = useState(emailNotifications);
  const [exportFormat, setExportFormat] = useState(defaultExportFormat);

  const updatePreference = async (field: string, value: boolean | string) => {
    const supabase = createClient();
    await supabase
      .from("users")
      .update({ [field]: value })
      .eq("id", userId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preferences</CardTitle>
        <CardDescription>Configure your meeting experience.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Auto-join calendar meetings</p>
            <p className="text-xs text-muted-foreground">
              Automatically schedule a bot for detected Google Meet events.
            </p>
          </div>
          <Switch
            checked={autoJoin}
            onCheckedChange={(v) => {
              setAutoJoin(v);
              updatePreference("auto_join_enabled", v);
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Email summary after meeting</p>
            <p className="text-xs text-muted-foreground">
              Receive a summary email once notes are ready.
            </p>
          </div>
          <Switch
            checked={emailNotif}
            onCheckedChange={(v) => {
              setEmailNotif(v);
              updatePreference("email_notifications", v);
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Default export format</p>
            <p className="text-xs text-muted-foreground">
              Choose the default format when exporting notes.
            </p>
          </div>
          <Select
            value={exportFormat}
            onValueChange={(val) => {
              if (val) {
                setExportFormat(val);
                updatePreference("default_export_format", val);
              }
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="plaintext">Plain Text</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
