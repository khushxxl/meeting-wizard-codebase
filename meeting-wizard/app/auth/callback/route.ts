import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const providerToken = sessionData.session?.provider_token ?? null;
      const providerRefreshToken = sessionData.session?.provider_refresh_token ?? null;

      // Ensure user profile exists
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const avatarUrl =
          user.user_metadata?.avatar_url ??
          user.user_metadata?.picture ??
          "";
        const fullName =
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          "";

        const { data: existingProfile } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();

        const tokenFields = providerToken
          ? {
              google_access_token: providerToken,
              google_refresh_token: providerRefreshToken,
              google_token_expires_at: new Date(
                Date.now() + 3600 * 1000
              ).toISOString(),
              google_calendar_connected: true,
            }
          : {};

        if (!existingProfile) {
          await supabase.from("users").insert({
            id: user.id,
            email: user.email ?? "",
            full_name: fullName,
            avatar_url: avatarUrl,
            ...tokenFields,
          });
        } else {
          // Update avatar, name, and tokens on every login
          await supabase
            .from("users")
            .update({
              avatar_url: avatarUrl,
              full_name: fullName,
              ...tokenFields,
            })
            .eq("id", user.id);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth`);
}
