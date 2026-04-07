import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/queries";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { IntegrationsCard } from "@/components/settings/integrations-card";
import { PreferencesForm } from "@/components/settings/preferences-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const profile = await getUserProfile(supabase, user.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences."
      />
      <ProfileForm
        userId={user.id}
        email={user.email ?? ""}
        fullName={profile?.full_name ?? ""}
        avatarUrl={profile?.avatar_url ?? ""}
      />
      <IntegrationsCard
        calendarConnected={profile?.google_calendar_connected ?? false}
        userId={user.id}
      />
      <PreferencesForm
        userId={user.id}
        autoJoinEnabled={profile?.auto_join_enabled ?? true}
        emailNotifications={profile?.email_notifications ?? false}
        defaultExportFormat={profile?.default_export_format ?? "pdf"}
      />
    </div>
  );
}
