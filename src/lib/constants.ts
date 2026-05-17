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

// Phase 10: Predefined labels for task organization
export const AVAILABLE_LABELS = [
  { label: "bug", color: "red" },
  { label: "feature", color: "blue" },
  { label: "design", color: "purple" },
  { label: "review", color: "yellow" },
  { label: "deployment", color: "green" }
] as const;

export const LABEL_COLORS: Record<string, string> = {
  bug: "bg-red-100 text-red-700 border-red-200",
  feature: "bg-blue-100 text-blue-700 border-blue-200",
  design: "bg-purple-100 text-purple-700 border-purple-200",
  review: "bg-yellow-100 text-yellow-700 border-yellow-200",
  deployment: "bg-green-100 text-green-700 border-green-200"
};

export const NOTIFICATION_TYPE_LABELS = {
  due_soon: "Due Soon",
  overdue: "Overdue",
  assigned: "Assigned",
  comment: "New Comment"
};

