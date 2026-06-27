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
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium",
        tone === "default" && "bg-flc-panel-muted text-flc-text border border-flc-border",
        tone === "success" && "bg-[#eef3ef] text-flc-success border border-[#cfe0d4]",
        tone === "warning" && "bg-[#f5f1e8] text-flc-warning border border-[#e3dac4]",
        tone === "danger" && "bg-[#f5eded] text-flc-danger border border-[#e1cccc]",
        className
      )}
      {...props}
    />
  );
}
