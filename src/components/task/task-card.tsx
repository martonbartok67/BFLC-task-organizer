import { CalendarClock, Flag, Milestone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, PRIORITY_TONE, LABEL_COLORS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Task } from "@/types/domain";

export function TaskCard({
  task,
  onClick,
  draggable = false,
  onDragStart,
  isDragging = false
}: {
  task: Task;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (taskId: string) => void;
  isDragging?: boolean;
}) {
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={() => onDragStart?.(task.id)}
      onClick={onClick}
      className={`group w-full rounded-md border bg-white p-3 text-left transition-all duration-150 ${
        isDragging 
          ? "shadow-lg shadow-flc-primary/40 border-flc-primary opacity-95" 
          : "hover:border-flc-primary hover:bg-flc-panel-muted"
      } ${
        task.isMilestone ? "border-flc-border border-l-[3px] border-l-flc-accent" : "border-flc-border"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="line-clamp-2 text-sm font-semibold text-flc-text">{task.title}</p>
        {task.isMilestone ? (
          <Milestone size={14} className="shrink-0 text-flc-accent" />
        ) : null}
      </div>

      {task.description ? (
        <p className="mb-3 line-clamp-2 text-xs text-flc-text-muted">{task.description}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {task.isUnassigned ? (
          <Badge className="gap-1 rounded-md bg-flc-panel-muted text-flc-text-muted border border-flc-border">
            <span>Unassigned</span>
          </Badge>
        ) : task.assigneeName ? (
          <Badge className="gap-1 rounded-md bg-flc-panel-muted text-flc-text-muted border border-flc-border">
            <User size={12} />
            <span className="truncate">{task.assigneeName}</span>
          </Badge>
        ) : null}
        <Badge tone={PRIORITY_TONE[task.priority]} className="gap-1 rounded-md transition-colors duration-150">
          <Flag size={12} />
          <span>{PRIORITY_LABELS[task.priority]}</span>
        </Badge>
        <Badge className="gap-1 rounded-md bg-flc-panel-muted text-flc-text-muted border border-flc-border transition-colors duration-150">
          <CalendarClock size={12} />
          <span>{formatDate(task.dueDate)}</span>
        </Badge>
        {task.labels && task.labels.length > 0 && (
          <>
            {task.labels.slice(0, 3).map((label) => (
              <Badge key={label} className={`rounded-md ${LABEL_COLORS[label] || 'bg-gray-100 text-gray-700 border-gray-200'} text-xs capitalize`}>
                {label}
              </Badge>
            ))}
            {task.labels.length > 3 && (
              <Badge className="rounded-md text-xs bg-gray-100 text-gray-700 border-gray-200">
                +{task.labels.length - 3}
              </Badge>
            )}
          </>
        )}
      </div>
    </button>
  );
}
