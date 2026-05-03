"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { TaskCard } from "@/components/task/task-card";
import type { BoardColumn, Profile, Task, TaskStatus } from "@/types/domain";

type MoveTaskInput = {
  taskId: string;
  toColumnId: string;
  toStatus: TaskStatus;
  toIndex: number;
};

export function KanbanBoard({
  columns,
  tasks,
  currentUserId,
  projectAdminId,
  projectMembers = [],
  onTaskSelect,
  onTaskMove,
  onTaskCreate,
  onTaskDelete,
  onTaskAssign
}: {
  columns: BoardColumn[];
  tasks: Task[];
  currentUserId?: string | null;
  projectAdminId?: string | null;
  projectMembers?: Profile[];
  onTaskSelect: (taskId: string) => void;
  onTaskMove: (input: MoveTaskInput) => Promise<void>;
  onTaskCreate: (input: { title: string; columnId: string; status: TaskStatus }) => Promise<void>;
  onTaskDelete?: (taskId: string) => Promise<void>;
  onTaskAssign?: (taskId: string, userId: string) => Promise<void>;
}) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isCreatingByColumn, setIsCreatingByColumn] = useState<Record<string, boolean>>({});
  const [newTitleByColumn, setNewTitleByColumn] = useState<Record<string, string>>({});
  const [assignPopoverOpen, setAssignPopoverOpen] = useState<Record<string, boolean>>({});

  const isAdmin = Boolean(currentUserId && projectAdminId && currentUserId === projectAdminId);

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

  async function handleDeleteTask(taskId: string, event: React.MouseEvent) {
    event.stopPropagation();
    if (onTaskDelete) {
      await onTaskDelete(taskId);
    }
  }

  async function handleAssignUser(taskId: string, userId: string) {
    if (onTaskAssign) {
      await onTaskAssign(taskId, userId);
    }
    setAssignPopoverOpen((prev) => ({ ...prev, [taskId]: false }));
  }

  return (
    <div className="flc-scroll flex gap-4 overflow-x-auto pb-2">
      {columns.map((column) => {
        const columnTasks = tasksByColumn.get(column.id) ?? [];
        const isCreating = Boolean(isCreatingByColumn[column.id]);
        const newTitle = newTitleByColumn[column.id] ?? "";

        return (
          <section
            key={column.id}
            className="flex h-[70vh] min-w-[300px] max-w-[320px] flex-col rounded-xl border border-flc-border bg-flc-panel-muted p-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(column, columnTasks.length)}
          >
            <div className="mb-3 flex items-center justify-between">
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
              <div className="mb-3 space-y-2 rounded-lg border border-flc-border bg-white p-2">
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
                  <div className="group relative">
                    <TaskCard
                      task={task}
                      draggable
                      onDragStart={setDraggedTaskId}
                      onClick={() => onTaskSelect(task.id)}
                    />
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Popover
                        open={assignPopoverOpen[task.id] ?? false}
                        onOpenChange={(open) =>
                          setAssignPopoverOpen((prev) => ({ ...prev, [task.id]: open }))
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <UserPlus size={14} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-48 p-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <p className="mb-2 text-xs font-medium text-flc-text-muted">
                            Assign Member
                          </p>
                          {projectMembers.length === 0 ? (
                            <p className="text-xs text-flc-text-muted">No members available</p>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {projectMembers.map((member) => (
                                <Button
                                  key={member.id}
                                  size="sm"
                                  variant={task.assigneeId === member.id ? "default" : "ghost"}
                                  className="justify-start text-xs"
                                  onClick={() => handleAssignUser(task.id, member.id)}
                                >
                                  {member.fullName || member.email}
                                </Button>
                              ))}
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                      {isAdmin && onTaskDelete ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-flc-danger hover:bg-flc-danger/10"
                          onClick={(event) => handleDeleteTask(task.id, event)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {columnTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-flc-border p-3 text-center text-xs text-flc-text-muted">
                  Drop tasks here
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
