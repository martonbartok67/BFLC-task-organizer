"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Link2, Paperclip, Send, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LabelEditor } from "@/components/task/label-editor";
import { PrioritySelector } from "@/components/task/priority-selector";
import { DueDatePicker } from "@/components/task/due-date-picker";
import type { Subtask, Task, TaskAttachment, TaskComment, TaskPriority, TaskStatus } from "@/types/domain";

type TaskDetails = {
  task: Task;
  subtasks: Subtask[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
};

function toDateInputValue(iso: string | null) {
  if (!iso) {
    return "";
  }
  return new Date(iso).toISOString().slice(0, 10);
}

function fromDateInputValue(date: string) {
  if (!date) {
    return null;
  }
  return new Date(date).toISOString();
}

const statusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" }
];

const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" }
];

export function TaskDrawer({
  taskId,
  projectId,
  open,
  onClose,
  onTaskChanged
}: {
  taskId: string | null;
  projectId: string | null;
  open: boolean;
  onClose: () => void;
  onTaskChanged: () => Promise<void>;
}) {
  const [details, setDetails] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [attachmentLabel, setAttachmentLabel] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Phase 2A: Role-based assignment
  const [projectMembers, setProjectMembers] = useState<Array<{ userId: string; userName: string; role: string }>>([]);
  const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (!open || !taskId) {
      return;
    }
    let cancelled = false;
    async function loadTask() {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/tasks/${taskId}`);
      const payload = await response.json();
      if (!cancelled) {
        if (!response.ok) {
          setError(payload.error ?? "Failed to load task details.");
          setDetails(null);
        } else {
          setDetails(payload.data as TaskDetails);
        }
        setLoading(false);
      }
    }
    loadTask();
    return () => {
      cancelled = true;
    };
  }, [open, taskId]);

  // Phase 2A: Load project members and user role
  useEffect(() => {
    if (!open || !projectId) {
      return;
    }
    let cancelled = false;
    async function loadProjectContext() {
      const response = await fetch(`/api/projects/${projectId}/members`);
      const payload = await response.json();
      if (!cancelled) {
        if (response.ok && payload.data?.members) {
          setProjectMembers(payload.data.members);
        }
      }
    }
    loadProjectContext();
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const progress = useMemo(() => {
    const total = details?.subtasks.length ?? 0;
    const done = details?.subtasks.filter((subtask) => subtask.isDone).length ?? 0;
    return { total, done, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, [details]);

  async function patchTask(patch: Partial<Task>) {
    if (!taskId || !details) {
      console.error("Missing taskId or details");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      
      if (!response.ok) {
        console.error(`Patch failed with status ${response.status}`);
      }
      
      const payload = await response.json();
      
      if (!response.ok) {
        const errorMessage = typeof payload.error === 'string' 
          ? payload.error 
          : typeof payload.error === 'object'
          ? JSON.stringify(payload.error)
          : "Could not update task.";
        console.error("Patch error:", errorMessage);
        setError(errorMessage);
      } else {
        setDetails((prev) =>
          prev
            ? {
                ...prev,
                task: payload.data
              }
            : prev
        );
        await onTaskChanged();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      console.error("Patch exception:", message);
      setError(`Error: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  async function createComment() {
    if (!taskId || !commentBody.trim()) {
      return;
    }
    const response = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentBody })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not add comment.");
      return;
    }
    setDetails((prev) =>
      prev
        ? {
            ...prev,
            comments: [...prev.comments, payload.data]
          }
        : prev
    );
    setCommentBody("");
    await onTaskChanged();
  }

  async function createSubtask() {
    if (!taskId || !subtaskTitle.trim()) {
      return;
    }
    const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: subtaskTitle })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not create subtask.");
      return;
    }
    setDetails((prev) =>
      prev
        ? {
            ...prev,
            subtasks: [...prev.subtasks, payload.data]
          }
        : prev
    );
    setSubtaskTitle("");
    await onTaskChanged();
  }

  async function toggleSubtask(subtaskId: string, isDone: boolean) {
    if (!taskId) {
      return;
    }
    const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not update subtask.");
      return;
    }
    setDetails((prev) =>
      prev
        ? {
            ...prev,
            subtasks: prev.subtasks.map((subtask) =>
              subtask.id === subtaskId ? payload.data : subtask
            )
          }
        : prev
    );
    await onTaskChanged();
  }

  async function attachLink() {
    if (!taskId || !attachmentUrl.trim()) {
      return;
    }
    const response = await fetch(`/api/tasks/${taskId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: attachmentLabel || "External link",
        type: "link",
        url: attachmentUrl
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not attach link.");
      return;
    }
    setDetails((prev) =>
      prev
        ? {
            ...prev,
            attachments: [payload.data, ...prev.attachments]
          }
        : prev
    );
    setAttachmentLabel("");
    setAttachmentUrl("");
    await onTaskChanged();
  }

  async function uploadFile(file: File | null) {
    if (!taskId || !file) {
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("label", attachmentLabel || file.name);
    const response = await fetch(`/api/tasks/${taskId}/attachments`, {
      method: "POST",
      body: formData
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not upload file.");
      return;
    }
    setDetails((prev) =>
      prev
        ? {
            ...prev,
            attachments: [payload.data, ...prev.attachments]
          }
        : prev
    );
    setAttachmentLabel("");
    await onTaskChanged();
  }

  /**
   * Phase 2A: Claim an unassigned task
   * Only available for members with unassigned tasks
   */
  async function claimTask() {
    if (!taskId || !projectId) {
      setError("Task or project information missing");
      return;
    }

    setIsClaiming(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/claim`,
        { method: "POST" }
      );
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Failed to claim task");
        setIsClaiming(false);
        return;
      }

      // Update local task state
      setDetails((prev) =>
        prev
          ? {
              ...prev,
              task: { ...prev.task, assigneeId: payload.data.assigneeId }
            }
          : prev
      );

      await onTaskChanged();
      setIsClaiming(false);
    } catch (e) {
      setError("Failed to claim task");
      setIsClaiming(false);
    }
  }

  /**
   * Phase 2A: Assign task to a member (admin only)
   */
  async function assignTask(assigneeId: string) {
    if (!taskId || !projectId) {
      setError("Task or project information missing");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assigneeId })
        }
      );
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Failed to assign task");
        setSaving(false);
        return;
      }

      // Update local task state
      setDetails((prev) =>
        prev
          ? {
              ...prev,
              task: { ...prev.task, assigneeId: payload.data.assigneeId }
            }
          : prev
      );

      await onTaskChanged();
      setSaving(false);
    } catch (e) {
      setError("Failed to assign task");
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35">
      <div className="flc-scroll h-full w-full max-w-[520px] overflow-y-auto border-l border-flc-border bg-white p-5 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-flc-text">Task Details</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {loading ? <p className="text-sm text-flc-text-muted">Loading...</p> : null}
        {error ? <p className="mb-4 text-sm text-flc-danger">{error}</p> : null}

        {!loading && details ? (
          <div className="space-y-6">
            <section className="space-y-3 rounded-xl border border-flc-border bg-flc-panel-muted p-4">
              <Input
                value={details.task.title}
                onChange={(event) =>
                  setDetails((prev) =>
                    prev
                      ? {
                          ...prev,
                          task: { ...prev.task, title: event.target.value }
                        }
                      : prev
                  )
                }
              />

              <Textarea
                rows={4}
                value={details.task.description ?? ""}
                onChange={(event) =>
                  setDetails((prev) =>
                    prev
                      ? {
                          ...prev,
                          task: { ...prev.task, description: event.target.value }
                        }
                      : prev
                  )
                }
                placeholder="Describe details, context, and dependencies."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-flc-text-muted">
                  Status
                  <select
                    value={details.task.status}
                    onChange={(event) =>
                      setDetails((prev) =>
                        prev
                          ? {
                              ...prev,
                              task: { ...prev.task, status: event.target.value as TaskStatus }
                            }
                          : prev
                      )
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-flc-border px-3 text-sm"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-medium text-flc-text-muted">
                  Priority
                  <PrioritySelector
                    value={details.task.priority}
                    onChange={(priority) =>
                      setDetails((prev) =>
                        prev
                          ? {
                              ...prev,
                              task: { ...prev.task, priority }
                            }
                          : prev
                      )
                    }
                  />
                </label>
              </div>

              {/* Phase 2A: Assignee field */}
              <div className="grid gap-3">
                <label className="text-xs font-medium text-flc-text-muted">
                  Assigned To
                  {projectMembers.length > 0 ? (
                    <div className="mt-1 flex flex-col gap-2">
                      {details.task.assigneeId ? (
                        <select
                          disabled={userRole !== "admin"}
                          value={details.task.assigneeId}
                          onChange={(event) => {
                            const newAssigneeId = event.target.value;
                            if (userRole === "admin") {
                              assignTask(newAssigneeId);
                            }
                          }}
                          className="h-10 w-full rounded-lg border border-flc-border px-3 text-sm disabled:bg-flc-panel-muted disabled:cursor-not-allowed"
                        >
                          {projectMembers.map((member) => (
                            <option key={member.userId} value={member.userId}>
                              {member.userName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex gap-2">
                          {userRole === "member" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              disabled={isClaiming}
                              onClick={claimTask}
                              className="flex-1"
                            >
                              {isClaiming ? "Claiming..." : "Claim Task"}
                            </Button>
                          ) : (
                            <select
                              value=""
                              onChange={(event) => {
                                const newAssigneeId = event.target.value;
                                if (newAssigneeId) {
                                  assignTask(newAssigneeId);
                                }
                              }}
                              className="h-10 w-full rounded-lg border border-flc-border px-3 text-sm"
                            >
                              <option value="">-- Select member --</option>
                              {projectMembers.map((member) => (
                                <option key={member.userId} value={member.userId}>
                                  {member.userName}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-flc-text-muted">Loading project members...</p>
                  )}
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-flc-text-muted">
                  Start
                  <Input
                    type="date"
                    value={toDateInputValue(details.task.startDate)}
                    onChange={(event) =>
                      setDetails((prev) =>
                        prev
                          ? {
                              ...prev,
                              task: {
                                ...prev.task,
                                startDate: fromDateInputValue(event.target.value)
                              }
                            }
                          : prev
                      )
                    }
                  />
                </label>
                <DueDatePicker
                  value={details.task.dueDate}
                  onChange={(dueDate) =>
                    setDetails((prev) =>
                      prev
                        ? {
                            ...prev,
                            task: { ...prev.task, dueDate }
                          }
                        : prev
                    )
                  }
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-flc-text-muted">
                <input
                  type="checkbox"
                  checked={details.task.isMilestone}
                  onChange={(event) =>
                    setDetails((prev) =>
                      prev
                        ? {
                            ...prev,
                            task: { ...prev.task, isMilestone: event.target.checked }
                          }
                        : prev
                    )
                  }
                />
                Mark as milestone
              </label>

              <LabelEditor
                value={details.task.labels || []}
                onChange={(labels) =>
                  setDetails((prev) =>
                    prev
                      ? {
                          ...prev,
                          task: { ...prev.task, labels }
                        }
                      : prev
                  )
                }
              />

              <Button
                className="w-full"
                onClick={() =>
                  patchTask({
                    title: details.task.title,
                    description: details.task.description,
                    status: details.task.status,
                    priority: details.task.priority,
                    startDate: details.task.startDate,
                    dueDate: details.task.dueDate,
                    labels: details.task.labels || [],
                    isMilestone: details.task.isMilestone
                  })
                }
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Task"}
              </Button>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-flc-text">Subtasks</h4>
                <Badge>{progress.done + "/" + progress.total}</Badge>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-flc-panel-muted">
                <div
                  className="h-full bg-flc-primary transition-all"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <div className="space-y-2">
                {details.subtasks.map((subtask) => (
                  <label
                    key={subtask.id}
                    className="flex items-center gap-2 rounded-lg border border-flc-border bg-white px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.isDone}
                      onChange={(event) => toggleSubtask(subtask.id, event.target.checked)}
                    />
                    <span className={subtask.isDone ? "text-flc-text-muted line-through" : "text-flc-text"}>
                      {subtask.title}
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={subtaskTitle}
                  onChange={(event) => setSubtaskTitle(event.target.value)}
                  placeholder="Add subtask..."
                />
                <Button size="sm" onClick={createSubtask}>
                  <Check size={14} />
                </Button>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-flc-text">Attachments</h4>
              <div className="rounded-lg border border-flc-border p-3">
                <Input
                  value={attachmentLabel}
                  onChange={(event) => setAttachmentLabel(event.target.value)}
                  placeholder="Attachment label"
                />
                <div className="mt-2 flex gap-2">
                  <Input
                    value={attachmentUrl}
                    onChange={(event) => setAttachmentUrl(event.target.value)}
                    placeholder="https://..."
                  />
                  <Button size="sm" onClick={attachLink}>
                    <Link2 size={14} />
                  </Button>
                </div>
                <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-flc-border px-3 py-2 text-xs text-flc-text-muted">
                  <Paperclip size={14} />
                  Upload file
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) => uploadFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <ul className="space-y-2 text-sm">
                {details.attachments.map((attachment) => (
                  <li key={attachment.id} className="rounded-lg border border-flc-border bg-white px-3 py-2">
                    <p className="font-medium text-flc-text">{attachment.label}</p>
                    {attachment.type === "link" && attachment.url ? (
                      <a href={attachment.url} target="_blank" rel="noreferrer" className="text-xs text-blue-700">
                        {attachment.url}
                      </a>
                    ) : (
                      <p className="text-xs text-flc-text-muted">{attachment.storagePath}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-flc-text">Comments</h4>
              <div className="space-y-2">
                {details.comments.map((comment) => (
                  <article
                    key={comment.id}
                    className="rounded-lg border border-flc-border bg-white px-3 py-2 text-sm"
                  >
                    <p className="mb-1 text-xs text-flc-text-muted">
                      {new Date(comment.createdAt).toLocaleString("en-US")}
                    </p>
                    <p className="text-flc-text">{comment.body}</p>
                    {comment.mentions.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {comment.mentions.map((mention) => (
                          <Badge key={mention}>@{mention}</Badge>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
              <div className="space-y-2 rounded-lg border border-flc-border p-3">
                <Textarea
                  value={commentBody}
                  onChange={(event) => setCommentBody(event.target.value)}
                  rows={3}
                  placeholder="Write a comment and use @mentions."
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={createComment}>
                    <Send size={14} className="mr-1" />
                    Comment
                  </Button>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
