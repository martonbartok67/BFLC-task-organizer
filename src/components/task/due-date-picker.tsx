"use client";

import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DueDatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  disabled?: boolean;
}

function toDateTimeInputValue(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function fromDateTimeInputValue(dateTime: string) {
  if (!dateTime) return null;
  return new Date(dateTime + ":00Z").toISOString();
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

  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const hasTime = date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0;
  return hasTime ? `${dateStr} at ${timeStr}` : dateStr;
}

export function DueDatePicker({ value, onChange, disabled = false }: DueDatePickerProps) {
  const isOverdue = value && new Date(value) < new Date();

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-[#8a92a0]">Due Date &amp; Time</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a92a0]" size={16} />
          <input
            type="datetime-local"
            value={toDateTimeInputValue(value)}
            onChange={(e) => onChange(fromDateTimeInputValue(e.target.value))}
            disabled={disabled}
            className={`w-full rounded-md border border-flc-border bg-white pl-10 pr-3 py-2 text-sm placeholder-flc-text-muted transition-colors duration-150 focus:border-flc-primary focus:outline-none focus:ring-2 focus:ring-flc-primary/20 disabled:opacity-50 ${
              isOverdue ? "border-flc-danger bg-[#f5eded]" : ""
            }`}
          />
        </div>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            className="text-[#8a92a0] hover:text-flc-text"
          >
            <X size={16} />
          </Button>
        )}
      </div>
      {value && (
        <p className={`text-xs ${isOverdue ? "text-flc-danger font-semibold" : "text-[#8a92a0]"}`}>
          {formatDueDate(value)}
        </p>
      )}
    </div>
  );
}
