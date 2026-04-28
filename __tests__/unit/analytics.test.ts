import { computeProjectProgress } from "@/lib/analytics";
import type { Task } from "@/types/domain";

function task(partial: Partial<Task>): Task {
  return {
    id: partial.id ?? crypto.randomUUID(),
    projectId: partial.projectId ?? "project-1",
    columnId: partial.columnId ?? "column-1",
    title: partial.title ?? "Task",
    description: partial.description ?? null,
    status: partial.status ?? "todo",
    priority: partial.priority ?? "medium",
    assigneeId: partial.assigneeId ?? null,
    dueDate: partial.dueDate ?? null,
    startDate: partial.startDate ?? null,
    position: partial.position ?? 0,
    isMilestone: partial.isMilestone ?? false,
    createdBy: partial.createdBy ?? "user-1",
    createdAt: partial.createdAt ?? new Date().toISOString(),
    updatedAt: partial.updatedAt ?? new Date().toISOString()
  };
}

describe("computeProjectProgress", () => {
  it("calculates completion and status distributions", () => {
    const now = new Date().toISOString();
    const tasks = [
      task({ id: "a", status: "done", updatedAt: now }),
      task({ id: "b", status: "in_progress", dueDate: "2000-01-01T00:00:00.000Z" }),
      task({ id: "c", status: "done", isMilestone: true, dueDate: now, updatedAt: now })
    ];
    const stats = computeProjectProgress("project-1", "Alpha", tasks);

    expect(stats.totalTasks).toBe(3);
    expect(stats.doneTasks).toBe(2);
    expect(stats.completionRate).toBeCloseTo(66.67, 1);
    expect(stats.overdueTasks).toBe(1);
    expect(stats.statusDistribution.find((item) => item.status === "done")?.count).toBe(2);
  });
});
