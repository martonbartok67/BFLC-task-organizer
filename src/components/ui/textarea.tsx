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
        "w-full  border border-[#d5dce5] bg-white px-3 py-2 text-sm text-flc-text placeholder:text-[#8a92a0] transition-all duration-300 hover:border-[#1a2942]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flc-primary/20 focus-visible:border-[#1a2942]",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
