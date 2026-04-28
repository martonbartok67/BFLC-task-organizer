"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { ActivityFeed } from "@/components/collaboration/activity-feed";
import { TaskDrawer } from "@/components/task/task-drawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { Textarea } from "@/components/ui/textarea";
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [boardData, setBoardData] = useState<BoardPayload | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);

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
      setError(payload.error ?? "Could not create project.");
      return;
    }
    const createdProject = payload.data as Project;
    setProjectName("");
    setProjectDescription("");
    await loadProjects();
    setSelectedProjectId(createdProject.id);
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
      <SectionHeader
        title="Multi-Project Workflow Dashboard"
        subtitle="Coordinate complex tasks across projects with a drag-and-drop delivery flow."
        actions={
          <>
            <Button variant="secondary" onClick={reloadEverything}>
              <RefreshCcw size={14} className="mr-2" />
              Refresh
            </Button>
            <Button onClick={() => (window.location.href = "/calendar")}>
              Calendar
              <ArrowRight size={14} className="ml-2" />
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-flc-text">Create Project</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="Project name"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
            />
            <Button onClick={createProject}>Add Project</Button>
          </div>
          <Textarea
            className="mt-2"
            rows={2}
            placeholder="Project description"
            value={projectDescription}
            onChange={(event) => setProjectDescription(event.target.value)}
          />
        </Card>

        <Card>
          <h3 className="mb-2 text-sm font-semibold text-flc-text">Project Switcher</h3>
          <select
            className="h-10 w-full rounded-lg border border-flc-border px-3 text-sm"
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
          <p className="mt-2 text-xs text-flc-text-muted">
            One workspace, multiple initiatives, unified execution.
          </p>
        </Card>
      </div>

      {error ? <p className="mb-4 text-sm text-flc-danger">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_330px]">
        <section>
          {!boardReady ? (
            <Card>
              <p className="text-sm text-flc-text-muted">
                {loadingBoard ? "Loading board..." : "Create or select a project to start organizing tasks."}
              </p>
            </Card>
          ) : (
            <KanbanBoard
              columns={boardData.columns}
              tasks={boardData.tasks}
              onTaskSelect={setDrawerTaskId}
              onTaskMove={moveTask}
              onTaskCreate={createTask}
            />
          )}
        </section>
        <ActivityFeed projectId={selectedProjectId ?? undefined} />
      </div>

      <TaskDrawer
        taskId={drawerTaskId}
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
