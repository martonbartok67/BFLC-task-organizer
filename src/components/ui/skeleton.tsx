import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-flc-border bg-white p-4 space-y-3",
        className
      )}
    >
      <div className="h-4 bg-flc-panel-muted rounded animate-pulse" />
      <div className="h-3 bg-flc-panel-muted rounded w-3/4 animate-pulse" />
      <div className="h-3 bg-flc-panel-muted rounded w-1/2 animate-pulse" />
    </div>
  );
}

export function SkeletonTask({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-flc-border bg-white p-3 space-y-2",
        className
      )}
    >
      <div className="h-4 bg-flc-panel-muted rounded animate-pulse" />
      <div className="flex gap-2">
        <div className="h-2 w-12 bg-flc-panel-muted rounded animate-pulse" />
        <div className="h-2 w-12 bg-flc-panel-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonLine({ width = "full" }: { width?: string }) {
  const widthClass = {
    full: "w-full",
    half: "w-1/2",
    "2/3": "w-2/3",
    "1/3": "w-1/3",
    "3/4": "w-3/4"
  }[width] || "w-full";

  return (
    <div className={`h-4 bg-flc-panel-muted rounded animate-pulse ${widthClass}`} />
  );
}

export function SkeletonActivityFeed() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-flc-panel-muted animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonLine width="2/3" />
              <SkeletonLine width="1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonKanbanColumn({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTask key={i} />
      ))}
    </div>
  );
}
