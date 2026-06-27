import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      // Phase 8: Beautify - smooth transitions, better focus states
      className={cn(
        "w-full rounded-md border border-flc-border bg-white px-3 py-2 text-sm text-flc-text placeholder:text-[#8a92a0] transition-colors duration-150 hover:border-flc-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flc-primary/20 focus-visible:border-flc-primary",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
