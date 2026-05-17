import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ 
  size = "md",
  className
}: { 
  size?: "sm" | "md" | "lg"
  className?: string 
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader 
        className={cn(
          sizeClasses[size],
          "text-flc-primary animate-spin"
        )}
      />
    </div>
  );
}
