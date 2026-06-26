"use client";

import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DueDatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  disabled?: boolean;
}

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

function fromDateInputValue(date: string) {
  if (!date) return null;
  return new Date(date).toISOString();
}

function formatDueDate(iso: string | null): string {
  if (!iso) return "No due date";
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return "Due today";
  if (isTomorrow) return "Due tomorrow";

  const isOverdue = date < today;
  if (isOverdue) {
    const daysOverdue = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}`;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DueDatePicker({ value, onChange, disabled = false }: DueDatePickerProps) {
  const isOverdue = value && new Date(value) < new Date();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#1a1a1a]">Due Date</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a92a0]" size={16} />
          <input
            type="date"
            value={toDateInputValue(value)}
            onChange={(e) => onChange(fromDateInputValue(e.target.value))}
            disabled={disabled}
            className={`w-full  border border-[#d5dce5] bg-white pl-10 pr-3 py-2 text-sm placeholder-flc-text-muted transition-all focus:border-[#1a2942] focus:outline-none focus:ring-2 focus:ring-[#1a2942] disabled:opacity-50 ${
              isOverdue ? "border-[#8b5a5a] bg-[#f5f0f0]" : ""
            }`}
          />
        </div>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            className="text-[#8a92a0] hover:text-[#1a1a1a]"
          >
            <X size={16} />
          </Button>
        )}
      </div>
      {value && (
        <p className={`text-xs ${isOverdue ? "text-[#8b5a5a] font-semibold" : "text-[#8a92a0]"}`}>
          {formatDueDate(value)}
        </p>
      )}
    </div>
  );
}
