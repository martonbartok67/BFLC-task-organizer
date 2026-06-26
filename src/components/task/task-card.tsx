import { CalendarClock, Flag, Milestone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, PRIORITY_TONE, LABEL_COLORS } from "@/lib/constants";
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
      className="group w-full border border-[#d5dce5] bg-white p-3 text-left transition-all duration-150 hover:border-[#1a2942] hover:bg-[#f8f9fb] hover:shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="line-clamp-2 text-sm font-semibold text-[#1a1a1a]">{task.title}</p>
        {task.isMilestone ? (
          <Milestone size={14} className="shrink-0 text-flc-primary" />
        ) : null}
      </div>

      {task.description ? (
        <p className="mb-3 line-clamp-2 text-xs text-[#8a92a0]">{task.description}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {task.isUnassigned ? (
          <Badge className="gap-1 bg-[#f0f2f5] text-[#4a5568] border border-[#d5dce5] rounded-none">
            <span>Unassigned</span>
          </Badge>
        ) : task.assigneeName ? (
          <Badge className="gap-1 bg-[#f0f2f5] text-[#4a5568] border border-[#d5dce5] rounded-none">
            <User size={12} />
            <span className="truncate">{task.assigneeName}</span>
          </Badge>
        ) : null}
        <Badge tone={PRIORITY_TONE[task.priority]} className="gap-1 transition-all duration-150 rounded-none">
          <Flag size={12} />
          <span>{PRIORITY_LABELS[task.priority]}</span>
        </Badge>
        <Badge className="gap-1 bg-[#f0f2f5] text-[#4a5568] border border-[#d5dce5] transition-all duration-150 rounded-none">
          <CalendarClock size={12} />
          <span>{formatDate(task.dueDate)}</span>
        </Badge>
        {/* Phase 10: Display labels (max 3 visible) */}
        {task.labels && task.labels.length > 0 && (
          <>
            {task.labels.slice(0, 3).map((label) => (
              <Badge key={label} className={`${LABEL_COLORS[label] || 'bg-gray-100 text-gray-700 border-gray-200'} text-xs capitalize`}>
                {label}
              </Badge>
            ))}
            {task.labels.length > 3 && (
              <Badge className="text-xs bg-gray-100 text-gray-700 border-gray-200">
                +{task.labels.length - 3}
              </Badge>
            )}
          </>
        )}
      </div>
    </button>
  );
}
