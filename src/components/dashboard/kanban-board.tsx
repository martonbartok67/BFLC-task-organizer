"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/task/task-card";
import type { BoardColumn, Task, TaskStatus } from "@/types/domain";

type MoveTaskInput = {
  taskId: string;
  toColumnId: string;
  toStatus: TaskStatus;
  toIndex: number;
};

export function KanbanBoard({
  columns,
  tasks,
  onTaskSelect,
  onTaskMove,
  onTaskCreate
}: {
  columns: BoardColumn[];
  tasks: Task[];
  onTaskSelect: (taskId: string) => void;
  onTaskMove: (input: MoveTaskInput) => Promise<void>;
  onTaskCreate: (input: { title: string; columnId: string; status: TaskStatus }) => Promise<void>;
}) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isCreatingByColumn, setIsCreatingByColumn] = useState<Record<string, boolean>>({});
  const [newTitleByColumn, setNewTitleByColumn] = useState<Record<string, string>>({});

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    columns.forEach((column) => map.set(column.id, []));
    tasks.forEach((task) => {
      const bucket = map.get(task.columnId);
      if (bucket) bucket.push(task);
    });
    for (const [, columnTasks] of map) {
      columnTasks.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [columns, tasks]);

  async function handleDrop(column: BoardColumn, toIndex: number) {
    if (!draggedTaskId) {
      return;
    }
    const movingTask = tasks.find((task) => task.id === draggedTaskId);
    if (!movingTask) {
      setDraggedTaskId(null);
      return;
    }
    await onTaskMove({
      taskId: movingTask.id,
      toColumnId: column.id,
      toStatus: column.key,
      toIndex
    });
    setDraggedTaskId(null);
  }

  async function handleCreateTask(column: BoardColumn) {
    const title = (newTitleByColumn[column.id] ?? "").trim();
    if (!title) {
      return;
    }
    await onTaskCreate({
      title,
      columnId: column.id,
      status: column.key
    });
    setNewTitleByColumn((prev) => ({ ...prev, [column.id]: "" }));
    setIsCreatingByColumn((prev) => ({ ...prev, [column.id]: false }));
  }

  return (
    // Phase 7: Mobile responsive - vertical on mobile, horizontal on desktop
    <div className="flc-scroll flex flex-col overflow-y-auto md:flex-row md:overflow-x-auto md:overflow-y-hidden gap-4 pb-2">
      {columns.map((column) => {
        const columnTasks = tasksByColumn.get(column.id) ?? [];
        const isCreating = Boolean(isCreatingByColumn[column.id]);
        const newTitle = newTitleByColumn[column.id] ?? "";

        return (
          <section
            key={column.id}
            // Phase 8: Beautify - gradient background, improved shadows
            className="flex h-[50vh] w-full md:h-[70vh] md:min-w-[300px] md:max-w-[320px] flex-col rounded-xl border border-flc-border bg-gradient-to-br from-flc-panel-muted to-slate-100/50 p-3 shadow-subtle hover:shadow-panel transition-all duration-300"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(column, columnTasks.length)}
          >
            {/* Column Header with Gradient */}
            <div className="mb-3 flex items-center justify-between rounded-lg bg-gradient-to-r from-flc-primary/5 to-flc-primary/0 px-2 py-2">
              <div>
                <h3 className="text-sm font-semibold text-flc-text">{column.name}</h3>
                <p className="text-xs text-flc-text-muted">{columnTasks.length} tasks</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setIsCreatingByColumn((prev) => ({
                    ...prev,
                    [column.id]: !prev[column.id]
                  }))
                }
              >
                <Plus size={14} />
              </Button>
            </div>

            {isCreating ? (
              <div className="mb-3 space-y-2 rounded-lg border border-flc-border bg-gradient-to-br from-white to-slate-50 p-3 shadow-subtle">
                <Input
                  value={newTitle}
                  onChange={(event) =>
                    setNewTitleByColumn((prev) => ({ ...prev, [column.id]: event.target.value }))
                  }
                  placeholder="Task title..."
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setIsCreatingByColumn((prev) => ({
                        ...prev,
                        [column.id]: false
                      }))
                    }
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleCreateTask(column)}>
                    Add
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flc-scroll flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {columnTasks.map((task, index) => (
                <div
                  key={task.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDrop(column, index);
                  }}
                >
                  <TaskCard
                    task={task}
                    draggable
                    onDragStart={setDraggedTaskId}
                    onClick={() => onTaskSelect(task.id)}
                  />
                </div>
              ))}
              {columnTasks.length === 0 ? (
                // Phase 8: Better empty state visual
                <div className="rounded-lg border-2 border-dashed border-flc-border/50 bg-gradient-to-br from-flc-panel-muted/50 to-slate-50/30 p-4 text-center text-xs text-flc-text-muted transition-all duration-300 hover:border-flc-border hover:bg-flc-panel-muted/50">
                  <p className="font-medium">No tasks yet</p>
                  <p className="text-xs mt-1">Drop or create tasks here</p>
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
