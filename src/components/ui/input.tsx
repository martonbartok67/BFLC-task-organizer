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
      // Phase 8: Beautify - smooth transitions, better focus states, improved border
      className={cn(
        "h-10 w-full rounded-md border border-flc-border bg-white px-3 text-sm text-flc-text placeholder:text-[#8a92a0] transition-colors duration-150 hover:border-flc-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flc-primary/20 focus-visible:border-flc-primary",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
