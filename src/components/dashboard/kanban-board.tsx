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

  const [mobileColumn, setMobileColumn] = useState<string | null>(columns[0]?.id ?? null);

  return (
    <>
      {/* Mobile: Status tabs */}
      <div className="flex md:hidden gap-2 mb-4 overflow-x-auto pb-2">
        {columns.map((column) => (
          <button
            key={column.id}
            onClick={() => setMobileColumn(column.id)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 flex-shrink-0 ${
              mobileColumn === column.id
                ? "bg-flc-primary text-white"
                : "bg-flc-panel-muted text-[#8a92a0] hover:text-flc-text"
            }`}
          >
            {column.name}
            <span className="ml-2 text-xs font-normal opacity-75">
              {(tasksByColumn.get(column.id) ?? []).length}
            </span>
          </button>
        ))}
      </div>

      {/* Kanban board: one column per view on mobile, all columns on desktop */}
      <div className="flc-scroll flex flex-col md:flex-row md:overflow-x-auto md:overflow-y-hidden gap-4 pb-2">
        {columns.map((column) => {
          // Skip columns not matching mobile view
          if (mobileColumn && column.id !== mobileColumn) {
            return null;
          }

          const columnTasks = tasksByColumn.get(column.id) ?? [];
          const isCreating = Boolean(isCreatingByColumn[column.id]);
          const newTitle = newTitleByColumn[column.id] ?? "";

          return (
            <section
              key={column.id}
              className="flex h-[50vh] w-full md:h-[70vh] md:min-w-[300px] md:max-w-[320px] flex-col rounded-lg border border-flc-border bg-flc-panel-muted p-3 transition-colors duration-150 hover:border-flc-accent"
            style={{
              animationDelay: `${columns.indexOf(column) * 100}ms`
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(column, columnTasks.length)}
          >
            {/* Column Header */}
            <div className="mb-3 flex items-center justify-between border-b border-[#e8ecf1] px-1 pb-2">
              <div>
                <h3 className="text-sm font-semibold text-[#1a1a1a]">{column.name}</h3>
                <p className="text-xs text-[#8a92a0]">{columnTasks.length} tasks</p>
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
              <div className="mb-3 space-y-2 rounded-md border border-[#d5dce5] bg-white p-3">
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
                    isDragging={draggedTaskId === task.id}
                    onDragStart={setDraggedTaskId}
                    onClick={() => onTaskSelect(task.id)}
                  />
                </div>
              ))}
              {columnTasks.length === 0 ? (
                // Phase 8: Better empty state visual
                <div className="rounded-md border-2 border-dashed border-flc-border bg-flc-panel-muted p-4 text-center text-xs text-[#8a92a0] transition-colors duration-150 hover:border-flc-primary/40">
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
