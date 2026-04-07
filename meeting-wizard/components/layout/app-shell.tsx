"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { BottomDock } from "./bottom-dock";
import { cn } from "@/lib/utils";

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
}

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserInfo;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div
        className={cn(
          "transition-[padding] duration-200",
          sidebarOpen ? "md:pl-60" : "md:pl-16"
        )}
      >
        <Header onMenuClick={() => setMobileNavOpen(true)} user={user} />
        <main className="p-6 pb-24">{children}</main>
      </div>
      <BottomDock sidebarOpen={sidebarOpen} userId={user.id} />
    </div>
  );
}
