import type React from "react";
import { cn } from "@/lib/utils";

export function Card({ 
  className,
  variant = "default",
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { 
  variant?: "default" | "accent" | "highlight"
}) {
  // Phase 9: Bolder cards - stronger borders, accent colors, animations
  return (
    <div
      className={cn(
        "rounded-none bg-gradient-to-br from-white to-slate-50/50 p-4  hover: transition-all duration-300 animate-fadeIn",
        variant === "default" && "border border-[#d5dce5]",
        variant === "accent" && "border-2 border-[#1a2942]/30 bg-gradient-to-br from-white to-blue-50/30",
        variant === "highlight" && "border-2 border-[#1a2942] bg-gradient-to-br from-blue-50 to-slate-50  shadow-flc-primary/20",
        className
      )}
      {...props}
    />
  );
}
