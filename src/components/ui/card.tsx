import type React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "accent" | "highlight"
}) {
  return (
    <div
      className={cn(
        "rounded-lg bg-white p-4 transition-colors duration-150",
        variant === "default" && "border border-flc-border",
        variant === "accent" && "border-2 border-flc-primary/30",
        variant === "highlight" && "border-2 border-flc-primary bg-flc-panel-muted",
        className
      )}
      {...props}
    />
  );
}
