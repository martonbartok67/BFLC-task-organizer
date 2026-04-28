import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-flc-border bg-white px-3 text-sm text-flc-text placeholder:text-flc-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,5,71,0.35)]",
        className
      )}
      {...props}
    />
  );
});
