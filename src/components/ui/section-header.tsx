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
        {/* Phase 9: Bolder headers - larger, stronger gradient, accent underline */}
        <div className="relative inline-block">
          <h2 className="bg-gradient-to-r from-flc-primary via-[#0a3f9f] to-flc-primary-strong bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            {title}
          </h2>
          {/* Accent underline */}
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-flc-primary to-flc-primary-strong rounded-full animate-fadeInUp" 
            style={{ width: "40%" }}
          />
        </div>
        {subtitle ? <p className="mt-3 text-base text-[#8a92a0] font-medium">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
