"use client";

import { Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, PRIORITY_TONE } from "@/lib/constants";
import type { TaskPriority } from "@/types/domain";

interface PrioritySelectorProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  disabled?: boolean;
}

const priorityOptions: TaskPriority[] = ["low", "medium", "high", "critical"];

export function PrioritySelector({ value, onChange, disabled = false }: PrioritySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#1a1a1a]">Priority</label>
      <div className="flex flex-wrap gap-2">
        {priorityOptions.map((priority) => (
          <button
            key={priority}
            onClick={() => onChange(priority)}
            disabled={disabled}
            className={` border-2 px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
              value === priority
                ? "border-[#1a2942] bg-flc-primary/10 text-flc-primary"
                : "border-[#d5dce5] bg-white text-flc-text hover:border-[#1a2942]/50"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="flex items-center gap-1.5">
              <Flag size={14} />
              {PRIORITY_LABELS[priority]}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-2">
        <Badge tone={PRIORITY_TONE[value]}>
          <Flag size={12} />
          <span>{PRIORITY_LABELS[value]}</span>
        </Badge>
      </div>
    </div>
  );
}
