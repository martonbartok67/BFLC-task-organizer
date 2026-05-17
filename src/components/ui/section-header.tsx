import type React from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  subtitle,
  actions,
  className
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="flex-1">
        {/* Phase 8: Beautify - gradient text effect on title */}
        <h2 className="bg-gradient-to-r from-flc-primary via-flc-primary to-flc-primary-strong bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-sm text-flc-text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
