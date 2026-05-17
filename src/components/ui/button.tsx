import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      // Phase 8: Beautify - improved transitions, shadows, active states
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,5,71,0.45)] disabled:cursor-not-allowed disabled:opacity-60",
        size === "md" ? "h-10 px-4 text-sm" : "h-8 px-3 text-xs",
        variant === "primary" && 
          "bg-gradient-to-br from-flc-primary to-flc-primary-strong text-white shadow-md hover:shadow-lg hover:shadow-flc-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        variant === "secondary" &&
          "border border-flc-border bg-white text-flc-text shadow-subtle hover:border-flc-border hover:bg-flc-panel-muted hover:shadow-panel hover:-translate-y-0.5 active:translate-y-0",
        variant === "ghost" && 
          "bg-transparent text-flc-text-muted hover:bg-flc-panel-muted hover:text-flc-text hover:shadow-subtle hover:-translate-y-0.5 active:translate-y-0",
        variant === "danger" && 
          "bg-gradient-to-br from-flc-danger to-red-700 text-white shadow-md hover:shadow-lg hover:shadow-flc-danger/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        className
      )}
      {...props}
    />
  );
}
