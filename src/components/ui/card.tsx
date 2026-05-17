import type React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // Phase 8: Beautify - gradient background, improved shadows
  return (
    <div
      className={cn("rounded-xl border border-flc-border bg-gradient-to-br from-white to-slate-50/50 p-4 shadow-subtle hover:shadow-panel transition-shadow duration-300", className)}
      {...props}
    />
  );
}
