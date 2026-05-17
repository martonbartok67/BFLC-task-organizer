import { CalendarClock, Flag, Milestone, User } from "lucide-react";
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
      // Phase 8: Beautify - gradients, improved shadows, smooth hover lift
      className="group w-full rounded-xl border border-flc-border bg-gradient-to-br from-white to-slate-50 p-3 text-left shadow-subtle transition-all duration-300 hover:-translate-y-1 hover:border-flc-primary hover:shadow-lg hover:shadow-flc-primary/10"
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
          <Badge className="gap-1 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200">
            <span>Unassigned</span>
          </Badge>
        ) : task.assigneeName ? (
          // Phase 6: Show assignee name when assigned
          <Badge className="gap-1 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200">
            <User size={12} />
            <span className="truncate">{task.assigneeName}</span>
          </Badge>
        ) : null}
        <Badge tone={PRIORITY_TONE[task.priority]} className="gap-1 transition-all duration-200">
          <Flag size={12} />
          <span>{PRIORITY_LABELS[task.priority]}</span>
        </Badge>
        <Badge className="gap-1 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200 transition-all duration-200">
          <CalendarClock size={12} />
          <span>{formatDate(task.dueDate)}</span>
        </Badge>
      </div>
    </button>
  );
}
