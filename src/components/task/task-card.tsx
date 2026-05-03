import { CalendarClock, Flag, Milestone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, PRIORITY_TONE } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Task } from "@/types/domain";

export function TaskCard({
  task,
  onClick,
  draggable = false,
  onDragStart
}: {
  task: Task;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (taskId: string) => void;
}) {
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={() => onDragStart?.(task.id)}
      onClick={onClick}
      className="group w-full rounded-xl border border-flc-border bg-white p-3 text-left shadow-subtle transition hover:-translate-y-[1px] hover:border-[#5b679c] hover:shadow-panel"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="line-clamp-2 text-sm font-semibold text-flc-text">{task.title}</p>
        {task.isMilestone ? (
          <Milestone size={14} className="shrink-0 text-flc-primary" />
        ) : null}
      </div>

      {task.description ? (
        <p className="mb-3 line-clamp-2 text-xs text-flc-text-muted">{task.description}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {task.isUnassigned ? (
          <Badge className="gap-1 bg-blue-100 text-blue-700">
            <span>Unassigned</span>
          </Badge>
        ) : null}
        <Badge tone={PRIORITY_TONE[task.priority]} className="gap-1">
          <Flag size={12} />
          <span>{PRIORITY_LABELS[task.priority]}</span>
        </Badge>
        <Badge className="gap-1">
          <CalendarClock size={12} />
          <span>{formatDate(task.dueDate)}</span>
        </Badge>
      </div>
    </button>
  );
}
