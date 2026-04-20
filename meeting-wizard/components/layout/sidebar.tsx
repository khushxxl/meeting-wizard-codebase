"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquareText,
  Settings,
  BookOpen,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Meetings", href: "/meetings", icon: MessageSquareText },
  { label: "Docs", href: "/docs", icon: BookOpen },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card transition-[width] duration-200",
        open ? "md:w-60" : "md:w-16",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-border h-16",
          open ? "px-6 gap-2" : "justify-center px-2",
        )}
      >
        {open && (
          <span className="font-semibold text-lg whitespace-nowrap">
            Described
          </span>
        )}
      </div>

      <nav className={cn("flex-1 py-4 space-y-1", open ? "px-3" : "px-2")}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors",
                open ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-2.5",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {open && item.label}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "border-t border-border py-3",
          open ? "px-3" : "px-2 flex justify-center",
        )}
      >
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
            open ? "gap-3 px-3 py-2.5 w-full" : "justify-center py-2.5 w-full",
          )}
        >
          {open ? (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              Collapse
            </>
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
