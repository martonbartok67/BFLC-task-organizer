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
      // Phase 9: Bolder aesthetics - stronger gradients, glowing effects, bold shadows
      className={cn(
        "inline-flex items-center justify-center  font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgba(0,5,71,0.45)] disabled:cursor-not-allowed disabled:opacity-60",
        size === "md" ? "h-10 px-5 text-sm" : "h-8 px-3 text-xs",
        variant === "primary" && 
          "bg-gradient-to-br from-flc-primary via-[#0a3f9f] to-flc-primary-strong text-white  hover:shadow-2xl hover:shadow-flc-primary/40 hover:-translate-y-1 hover:scale-105 active:scale-95 active:translate-y-0 active:shadow-md border border-[#1a2942]/20",
        variant === "secondary" &&
          "border-2 border-[#1a2942] bg-white text-flc-primary shadow-md hover:border-[#1a2942]-strong hover:bg-flc-primary/5 hover: hover:-translate-y-0.5 active:scale-95 font-semibold",
        variant === "ghost" && 
          "bg-transparent text-[#8a92a0] hover:bg-flc-primary/10 hover:text-flc-primary hover: hover:-translate-y-0.5 active:scale-95 transition-all duration-200",
        variant === "danger" && 
          "bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white  hover:shadow-2xl hover:shadow-red-600/40 hover:-translate-y-1 hover:scale-105 active:scale-95 border border-red-500/20",
        className
      )}
      {...props}
    />
  );
}
