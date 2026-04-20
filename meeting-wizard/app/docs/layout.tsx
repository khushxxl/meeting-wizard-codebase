import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    const userInfo = {
      id: user.id,
      email: user.email ?? "",
      fullName: profile?.full_name ?? "",
      avatarUrl: profile?.avatar_url ?? "",
    };

    return <AppShell user={userInfo}>{children}</AppShell>;
  }

  // Public layout for signed-out visitors
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold">
            Described
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign in →
          </Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
