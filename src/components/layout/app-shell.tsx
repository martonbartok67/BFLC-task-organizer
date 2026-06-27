"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, CalendarDays, ClipboardList, FolderKanban, UserCheck, Menu, X, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// Primary: daily-use workspace views. Secondary: infrequent (approval gate, auth).
const primaryNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: FolderKanban },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: BarChart3 }
];

const secondaryNavItems = [
  { href: "/access-requests", label: "Access Requests", icon: UserCheck },
  { href: "/signup", label: "Account", icon: ClipboardList }
];

const allNavItems = [...primaryNavItems, ...secondaryNavItems];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAnySecondaryActive = secondaryNavItems.some((item) => pathname.startsWith(item.href));

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 md:hidden border-b border-flc-border bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-flc-primary flex items-center justify-center">
              <span className="text-white font-semibold text-xs">FLC</span>
            </div>
            <span className="font-semibold text-flc-text text-sm">Task Organizer</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-2 text-[#4a5568] hover:bg-flc-panel-muted"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-60px)] md:min-h-screen">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-flc-border flex flex-col transition-transform duration-200 md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0 top-[60px] md:top-0" : "-translate-x-full md:translate-x-0"
        )}>
          {/* Header (Desktop Only) */}
          <div className="hidden md:flex items-center gap-2 px-6 py-5 border-b border-[#e8ecf1]">
            <div className="w-8 h-8 rounded-md bg-flc-primary flex items-center justify-center">
              <span className="text-white font-semibold text-xs">FLC</span>
            </div>
            <div>
              <p className="text-xs text-[#718096] font-semibold leading-none">BFLC</p>
              <p className="text-sm font-semibold text-flc-text leading-tight">Task Organizer</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-auto">
            <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a92a0]">
              Workspace
            </p>
            <div className="space-y-1">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors duration-150",
                      isActive
                        ? "bg-flc-primary text-white"
                        : "text-[#4a5568] hover:bg-flc-panel-muted hover:text-flc-text"
                    )}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <p className="px-4 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wide text-[#8a92a0]">
              Team
            </p>
            <div className="space-y-1">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors duration-150",
                      isActive
                        ? "bg-flc-primary text-white"
                        : "text-[#4a5568] hover:bg-flc-panel-muted hover:text-flc-text"
                    )}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer Info */}
          <div className="border-t border-[#e8ecf1] p-4">
            <div className="rounded-md bg-flc-panel-muted p-3">
              <p className="text-xs text-[#718096] font-semibold">WORKSPACE</p>
              <p className="mt-2 text-sm font-semibold text-flc-text">Single Team</p>
              <p className="mt-1 text-xs text-[#8a92a0]">Organized & collaborative</p>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/15 md:hidden top-[60px]"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>

          {/* Mobile Bottom Tab Bar: 3 primary + "More" for secondary group */}
          <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t border-flc-border bg-white">
            <div className="flex items-center justify-around">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    className={cn(
                      "flex flex-1 flex-col items-center justify-center gap-1 py-3 px-2 text-xs font-medium transition-colors duration-150 relative",
                      isActive
                        ? "text-flc-primary"
                        : "text-[#8a92a0] hover:text-[#4a5568]"
                    )}
                  >
                    <Icon size={20} />
                    <span className="line-clamp-1">{item.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 h-0.5 w-8 bg-flc-primary" />
                    )}
                  </Link>
                );
              })}
              <button
                onClick={() => setSidebarOpen(true)}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-3 px-2 text-xs font-medium transition-colors duration-150 relative",
                  isAnySecondaryActive ? "text-flc-primary" : "text-[#8a92a0] hover:text-[#4a5568]"
                )}
              >
                <MoreHorizontal size={20} />
                <span>More</span>
                {isAnySecondaryActive && (
                  <div className="absolute bottom-0 h-0.5 w-8 bg-flc-primary" />
                )}
              </button>
            </div>
          </nav>
        </main>
      </div>
    </div>
  );
}
