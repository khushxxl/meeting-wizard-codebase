"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { BottomDock } from "./bottom-dock";
import {
  ProductTour,
  DASHBOARD_TOUR,
  MEETINGS_TOUR,
} from "@/components/onboarding/product-tour";
import { cn } from "@/lib/utils";

const SIDEBAR_KEY = "described:sidebar-open";

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
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored !== null) setSidebarOpen(stored === "1");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(SIDEBAR_KEY, sidebarOpen ? "1" : "0");
  }, [sidebarOpen, hydrated]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} animate={hydrated} />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div
        className={cn(
          hydrated && "transition-[padding] duration-200",
          sidebarOpen ? "md:pl-60" : "md:pl-16"
        )}
      >
        <Header onMenuClick={() => setMobileNavOpen(true)} user={user} />
        <main className="p-6 pb-24">{children}</main>
      </div>
      <BottomDock sidebarOpen={sidebarOpen} userId={user.id} />
      {pathname === "/dashboard" && (
        <ProductTour tourId="dashboard" steps={DASHBOARD_TOUR} />
      )}
      {pathname === "/meetings" && (
        <ProductTour tourId="meetings" steps={MEETINGS_TOUR} />
      )}
    </div>
  );
}
