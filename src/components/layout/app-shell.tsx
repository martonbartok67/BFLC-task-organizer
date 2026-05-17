"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, ClipboardList, FolderKanban, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: FolderKanban },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/access-requests", label: "Access Requests", icon: UserCheck },
  { href: "/signup", label: "Signup", icon: ClipboardList }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {/* Phase 7: Mobile header with branding */}
      <div className="panel mx-3 mt-3 p-3 md:hidden">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">FLC Task Organizer</p>
      </div>

      <div className="flex min-h-screen gap-4 px-3 py-4 pb-24 sm:gap-6 sm:px-6 sm:py-6 md:pb-4">
        {/* Desktop Sidebar */}
        <aside className="panel hidden w-72 shrink-0 flex-col p-5 md:flex">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">FLC Team Suite</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-flc-primary">
              FLC Task Organizer
            </h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-flc-primary text-white shadow-panel"
                      : "text-flc-text-muted hover:bg-flc-panel-muted hover:text-flc-text"
                  )}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-xl border border-flc-border bg-flc-panel-muted p-4">
            <p className="text-xs uppercase tracking-widest text-flc-text-muted">Workspace</p>
            <p className="mt-2 text-sm font-semibold text-flc-text">Single Team Instance</p>
            <p className="mt-1 text-xs text-flc-text-muted">
              Keep workflows focused, traceable, and collaborative.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto rounded-[18px] border border-flc-border bg-flc-panel p-4 shadow-panel sm:p-6">
          {children}
        </main>
      </div>

      {/* Phase 7: Elegant Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-flc-border bg-white/95 backdrop-blur md:hidden">
        <div className="mx-3 flex items-center justify-around gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as any}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 rounded-t-2xl py-3 px-2 text-xs font-medium transition-all duration-200",
                  isActive
                    ? "text-flc-primary"
                    : "text-flc-text-muted hover:text-flc-text"
                )}
              >
                <Icon size={20} />
                <span className="line-clamp-1">{item.label}</span>
                {isActive ? (
                  <div className="absolute bottom-0 h-1 w-12 rounded-full bg-flc-primary" />
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
