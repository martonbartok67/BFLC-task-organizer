import type { TaskStatus } from "@/types/domain";

const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  backlog: ["todo", "in_progress"],
  todo: ["backlog", "in_progress", "review"],
  in_progress: ["todo", "review", "done"],
  review: ["in_progress", "done"],
  done: ["review", "in_progress"]
};

export function isValidStatusTransition(from: TaskStatus, to: TaskStatus) {
  if (from === to) {
    return true;
  }
  return allowedTransitions[from].includes(to);
}
