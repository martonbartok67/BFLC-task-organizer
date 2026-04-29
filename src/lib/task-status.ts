import type { TaskStatus } from "@/types/domain";

const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  todo: ["in_progress", "done"],
  in_progress: ["todo", "done"],
  done: ["in_progress"] // Can reopen done tasks
};

export function isValidStatusTransition(from: TaskStatus, to: TaskStatus) {
  if (from === to) {
    return true;
  }
  return allowedTransitions[from].includes(to);
}

export function getStatusDisplayName(status: TaskStatus): string {
  const names: Record<TaskStatus, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done"
  };
  return names[status];
}
