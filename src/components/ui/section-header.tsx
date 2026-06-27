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
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-flc-text">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[#8a92a0]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
