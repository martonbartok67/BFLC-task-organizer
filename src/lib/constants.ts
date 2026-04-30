import type { TaskPriority, TaskStatus } from "@/types/domain";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done"
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical"
};

export const PRIORITY_TONE: Record<TaskPriority, "default" | "warning" | "danger"> = {
  low: "default",
  medium: "default",
  high: "warning",
  critical: "danger"
};
