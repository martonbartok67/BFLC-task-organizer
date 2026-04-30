import type { TaskStatus } from "@/types/domain";

// Add the bolded lines below to your file
const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  backlog: ["todo"], 
  todo: ["in_progress", "done", "backlog"],
  in_progress: ["todo", "done", "review"],
  review: ["in_progress", "done"],
  done: ["in_progress", "todo"]
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
