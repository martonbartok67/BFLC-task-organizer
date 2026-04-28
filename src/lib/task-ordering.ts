import type { Task } from "@/types/domain";

export function reorderTasks<T extends Pick<Task, "id" | "position">>(
  tasks: T[],
  movingTaskId: string,
  toIndex: number
) {
  const sorted = [...tasks].sort((a, b) => a.position - b.position);
  const fromIndex = sorted.findIndex((task) => task.id === movingTaskId);
  if (fromIndex === -1) {
    return sorted;
  }
  const clampedTarget = Math.max(0, Math.min(toIndex, sorted.length - 1));
  const [movingTask] = sorted.splice(fromIndex, 1);
  sorted.splice(clampedTarget, 0, movingTask);
  return sorted.map((task, index) => ({ ...task, position: index * 1000 }));
}
