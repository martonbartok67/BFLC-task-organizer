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
      className={cn(
        "w-full rounded-lg border border-flc-border bg-white px-3 py-2 text-sm text-flc-text placeholder:text-flc-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,5,71,0.35)]",
        className
      )}
      {...props}
    />
  );
});
