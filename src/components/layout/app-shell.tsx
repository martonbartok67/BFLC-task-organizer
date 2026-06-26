"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, CalendarDays, ClipboardList, FolderKanban, UserCheck, Menu, X } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 md:hidden border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
              <span className="text-white font-bold text-xs">FLC</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">Task Organizer</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-60px)] md:min-h-screen">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0 top-[60px] md:top-0" : "-translate-x-full md:translate-x-0"
        )}>
          {/* Logo Section (Desktop Only) */}
          <div className="hidden md:block border-b border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <span className="text-white font-bold text-sm">FLC</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Budapest FLC</p>
                <h1 className="text-base font-bold text-slate-900">Task Organizer</h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-slate-900 text-white shadow-lg"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-yellow-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Workspace Info */}
          <div className="border-t border-slate-200 p-4">
            <div className="rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
              <p className="text-xs uppercase tracking-widest font-semibold opacity-80">Workspace</p>
              <p className="mt-2 text-sm font-semibold">Single Team</p>
              <p className="mt-1 text-xs opacity-70">
                Focused & collaborative workflows
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/20 md:hidden top-[60px]"
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

          {/* Mobile Bottom Tab Bar */}
          <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-around">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    className={cn(
                      "flex flex-1 flex-col items-center justify-center gap-1 py-3 px-2 text-xs font-medium transition-all duration-200 relative",
                      isActive
                        ? "text-slate-900"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <Icon size={20} />
                    <span className="line-clamp-1">{item.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-slate-900" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </main>
      </div>
    </div>
  );
}
