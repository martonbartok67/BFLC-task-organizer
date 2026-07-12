"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { MembersManagement } from "@/components/dashboard/members-management";
import { ActivityFeed } from "@/components/collaboration/activity-feed";
import { TaskDrawer } from "@/components/task/task-drawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SkeletonCard, SkeletonKanbanColumn, SkeletonActivityFeed } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast-context";
import type { BoardColumn, Project, Task } from "@/types/domain";

type BoardPayload = {
  project: Project | null;
  columns: BoardColumn[];
  tasks: Task[];
};

function buildProjectCode(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .slice(0, 3)
    .map((chunk) => chunk.slice(0, 2))
    .join("");
}

export function DashboardView({ initialProjectId }: { initialProjectId?: string | null } = {}) {
  const { addToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [boardData, setBoardData] = useState<BoardPayload | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  // Phase 2A: View mode
  const [viewMode, setViewMode] = useState<"board" | "members">("board");
  const [showCreateProject, setShowCreateProject] = useState(false);

  async function loadProjects() {
    const response = await fetch("/api/projects");
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Could not load projects.");
    }
    const loadedProjects = (payload.data ?? []) as Project[];
    setProjects(loadedProjects);
    if (!selectedProjectId && loadedProjects.length > 0) {
      const preferred = initialProjectId
        ? loadedProjects.find((project) => project.id === initialProjectId)?.id
        : null;
      setSelectedProjectId(preferred ?? loadedProjects[0].id);
    }
  }

  async function loadBoard(projectId: string) {
    setLoadingBoard(true);
    const response = await fetch(`/api/projects/${projectId}`);
    const payload = await response.json();
    if (!response.ok) {
      setLoadingBoard(false);
      throw new Error(payload.error ?? "Could not load board.");
    }
    setBoardData(payload.data as BoardPayload);
    setLoadingBoard(false);
  }

  async function reloadEverything() {
    try {
      setError(null);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  }

  useEffect(() => {
    reloadEverything();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }
    loadBoard(selectedProjectId).catch((err: unknown) =>
      setError(err instanceof Error ? err.message : "Could not load board")
    );
  }, [selectedProjectId]);

  const projectOptions = useMemo(
    () => projects.map((project) => ({ id: project.id, name: project.name })),
    [projects]
  );

  const taskCounts = useMemo(() => {
    const tasks = boardData?.tasks ?? [];
    return {
      todo: tasks.filter((t) => t.status === "todo").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      done: tasks.filter((t) => t.status === "done").length
    };
  }, [boardData]);

  async function createProject() {
    if (!projectName.trim()) {
      return;
    }
    setError(null);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName,
        code: buildProjectCode(projectName) || "FLC",
        description: projectDescription || null
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      const errorMsg = payload.error ?? "Could not create project.";
      setError(errorMsg);
      addToast(errorMsg, "error");
      return;
    }
    const createdProject = payload.data as Project;
    setProjectName("");
    setProjectDescription("");
    await loadProjects();
    setSelectedProjectId(createdProject.id);
    addToast(`Project "${createdProject.name}" created`, "success");
    setShowCreateProject(false);
  }

  async function moveTask(input: {
    taskId: string;
    toColumnId: string;
    toStatus: Task["status"];
    toIndex: number;
  }) {
    const response = await fetch(`/api/tasks/${input.taskId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not move task.");
      return;
    }
    if (selectedProjectId) {
      await loadBoard(selectedProjectId);
    }
  }

  async function createTask(input: { title: string; columnId: string; status: Task["status"] }) {
    if (!selectedProjectId) {
      return;
    }
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: selectedProjectId,
        columnId: input.columnId,
        title: input.title,
        status: input.status,
        priority: "medium"
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not create task.");
      return;
    }
    await loadBoard(selectedProjectId);
  }

  const boardReady = boardData?.project && boardData.columns.length > 0;

  return (
    <>
      {/* Header: bold title + inline project switcher + primary actions */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-flc-text tracking-tight">Workflow Dashboard</h1>
          <p className="mt-1 text-sm text-[#8a92a0]">
            Coordinate tasks across projects with drag-and-drop delivery.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-md border border-flc-border bg-white px-3 text-sm text-flc-text"
            value={selectedProjectId ?? ""}
            onChange={(event) => setSelectedProjectId(event.target.value || null)}
          >
            <option value="">Select project...</option>
            {projectOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={reloadEverything}>
            <RefreshCcw size={14} className="mr-2" />
            Refresh
          </Button>
          <Button onClick={() => (window.location.href = "/calendar")}>
            Calendar
            <ArrowRight size={14} className="ml-2" />
          </Button>
        </div>
      </div>

      {/* Stat strip: real counts from boardData, no decoration */}
      {boardReady && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-flc-border bg-white p-4 border-l-[3px] border-l-[#6b7c99]">
            <p className="text-2xl font-bold text-flc-text">{taskCounts.todo}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-[#8a92a0]">To Do</p>
          </div>
          <div className="rounded-lg border border-flc-border bg-white p-4 border-l-[3px] border-l-flc-accent">
            <p className="text-2xl font-bold text-flc-text">{taskCounts.inProgress}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-[#8a92a0]">In Progress</p>
          </div>
          <div className="rounded-lg border border-flc-border bg-white p-4 border-l-[3px] border-l-flc-success">
            <p className="text-2xl font-bold text-flc-text">{taskCounts.done}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-[#8a92a0]">Done</p>
          </div>
        </div>
      )}

      {/* Create project: collapsed by default to keep the board primary */}
      <div className="mb-5">
        {!showCreateProject ? (
          <button
            onClick={() => setShowCreateProject(true)}
            className="text-sm font-medium text-flc-primary hover:underline"
          >
            + New project
          </button>
        ) : (
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-flc-text">Create Project</h3>
              <button
                onClick={() => setShowCreateProject(false)}
                className="text-xs text-[#8a92a0] hover:text-flc-text"
              >
                Cancel
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Project name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
              />
              <Button
                onClick={async () => {
                  await createProject();
                  setShowCreateProject(false);
                }}
              >
                Add Project
              </Button>
            </div>
            <Textarea
              className="mt-2"
              rows={2}
              placeholder="Project description"
              value={projectDescription}
              onChange={(event) => setProjectDescription(event.target.value)}
            />
          </Card>
        )}
      </div>

      {error ? <p className="mb-4 text-sm text-flc-danger">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section>
          {/* View toggle: segmented control, same setViewMode mechanic */}
          <div className="mb-4 inline-flex rounded-md border border-flc-border bg-flc-panel-muted p-1">
            <button
              onClick={() => setViewMode("board")}
              className={`rounded-[4px] px-4 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "board"
                  ? "bg-white text-flc-text shadow-sm"
                  : "text-[#8a92a0] hover:text-flc-text"
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode("members")}
              className={`rounded-[4px] px-4 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "members"
                  ? "bg-white text-flc-text shadow-sm"
                  : "text-[#8a92a0] hover:text-flc-text"
              }`}
            >
              Members
            </button>
          </div>

          {!boardReady ? (
            loadingBoard ? (
              <div className="grid gap-4 grid-cols-3">
                <SkeletonKanbanColumn count={4} />
                <SkeletonKanbanColumn count={2} />
                <SkeletonKanbanColumn count={3} />
              </div>
            ) : (
              <Card>
                <p className="text-sm text-[#8a92a0]">
                  Create or select a project to start.
                </p>
              </Card>
            )
          ) : viewMode === "board" ? (
            <KanbanBoard
              columns={boardData.columns}
              tasks={boardData.tasks}
              onTaskSelect={setDrawerTaskId}
              onTaskMove={moveTask}
              onTaskCreate={createTask}
            />
          ) : (
            <MembersManagement
              projectId={selectedProjectId}
            />
          )}
        </section>
        <ActivityFeed projectId={selectedProjectId ?? undefined} />
      </div>

      <TaskDrawer
        taskId={drawerTaskId}
        projectId={selectedProjectId}
        open={Boolean(drawerTaskId)}
        onClose={() => setDrawerTaskId(null)}
        onTaskChanged={async () => {
          if (selectedProjectId) {
            await loadBoard(selectedProjectId);
          }
        }}
      />
    </>
  );
}
