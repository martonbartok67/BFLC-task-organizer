import type { ProjectProgressStats, Task, TaskStatus } from "@/types/domain";

function isDone(status: TaskStatus) {
  return status === "done";
}

function isOverdue(task: Task) {
  return Boolean(task.dueDate && !isDone(task.status) && new Date(task.dueDate) < new Date());
}

export function computeProjectProgress(
  projectId: string,
  projectName: string,
  tasks: Task[]
): ProjectProgressStats {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((task) => isDone(task.status)).length;
  const completionRate = totalTasks === 0 ? 0 : Number(((doneTasks / totalTasks) * 100).toFixed(2));
  const overdueTasks = tasks.filter(isOverdue).length;

  const statusCounts = tasks.reduce<Record<TaskStatus, number>>(
    (acc, task) => {
      acc[task.status] += 1;
      return acc;
    },
    {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0
    }
  );

  const statusDistribution = (Object.keys(statusCounts) as TaskStatus[]).map((status) => ({
    status,
    count: statusCounts[status]
  }));

  const milestoneTasks = tasks
    .filter((task) => task.isMilestone)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

  const milestoneBurndown = milestoneTasks.map((task, index) => ({
    date: task.dueDate ?? task.createdAt,
    remainingMilestones: milestoneTasks.length - index
  }));

  const trendMap = new Map<string, number>();
  tasks.forEach((task) => {
    if (task.status !== "done") {
      return;
    }
    const period = new Date(task.updatedAt).toISOString().slice(0, 7);
    trendMap.set(period, (trendMap.get(period) ?? 0) + 1);
  });

  const completionTrend = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, completedCount]) => ({ period, completedCount }));

  return {
    projectId,
    projectName,
    totalTasks,
    doneTasks,
    completionRate,
    overdueTasks,
    milestoneBurndown,
    statusDistribution,
    completionTrend
  };
}
