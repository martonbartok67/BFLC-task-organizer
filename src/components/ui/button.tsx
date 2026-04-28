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
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,5,71,0.45)] disabled:cursor-not-allowed disabled:opacity-60",
        size === "md" ? "h-10 px-4 text-sm" : "h-8 px-3 text-xs",
        variant === "primary" && "bg-flc-primary text-white hover:bg-flc-primary-strong",
        variant === "secondary" &&
          "border border-flc-border bg-white text-flc-text hover:bg-flc-panel-muted",
        variant === "ghost" && "bg-transparent text-flc-text-muted hover:bg-flc-panel-muted",
        variant === "danger" && "bg-flc-danger text-white hover:opacity-90",
        className
      )}
      {...props}
    />
  );
}
