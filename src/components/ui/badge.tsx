import type React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <span
      // Phase 8: Beautify - gradients, shadows, better visual hierarchy
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm",
        tone === "default" && "bg-gradient-to-r from-slate-100 to-slate-50 text-flc-text border border-slate-200",
        tone === "success" && "bg-gradient-to-r from-emerald-100 to-teal-50 text-emerald-800 border border-emerald-200 shadow-emerald-100/50",
        tone === "warning" && "bg-gradient-to-r from-amber-100 to-orange-50 text-amber-800 border border-amber-200 shadow-amber-100/50",
        tone === "danger" && "bg-gradient-to-r from-rose-100 to-pink-50 text-rose-800 border border-rose-200 shadow-rose-100/50",
        className
      )}
      {...props}
    />
  );
}
