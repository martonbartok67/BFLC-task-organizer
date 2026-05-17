import type React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "compact";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-flc-border/50 bg-gradient-to-br from-flc-panel-muted/30 to-slate-50/50 p-6 text-center transition-all duration-300 hover:border-flc-border hover:bg-flc-panel-muted/50",
        variant === "compact" && "p-4",
        className
      )}
      {...props}
    >
      {Icon ? (
        <Icon
          size={variant === "compact" ? 32 : 48}
          className="mb-3 text-flc-text-muted opacity-50 transition-transform duration-300 group-hover:scale-110"
        />
      ) : null}
      <h3 className="text-sm font-semibold text-flc-text">{title}</h3>
      {description ? (
        <p className="mt-1 text-xs text-flc-text-muted max-w-xs">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
