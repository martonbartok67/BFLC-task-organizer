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
      <div className="panel mx-3 mt-3 p-3 md:hidden">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">FLC Task Organizer</p>
        <nav className="flc-scroll mt-3 flex gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as any} // Add "as any" right here
                className={cn(
                  "shrink-0 rounded-lg px-3 py-2 text-xs font-semibold",
                  isActive
                    ? "bg-flc-primary text-white"
                    : "border border-flc-border bg-white text-flc-text-muted"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mx-auto flex min-h-screen max-w-[1500px] gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6">
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

        <main className="flex-1 overflow-hidden rounded-[18px] border border-flc-border bg-flc-panel p-4 shadow-panel sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
