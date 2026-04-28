import type React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-flc-border bg-white p-4 shadow-subtle", className)}
      {...props}
    />
  );
}
