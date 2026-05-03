import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { deleteTask, getProjectBoard, listTaskDetails, logActivity, updateTask } from "@/lib/data-access";
import { taskUpdateSchema } from "@/lib/validation";
import type { Task } from "@/types/domain";

function mapTaskPatch(input: Record<string, unknown>): Partial<Task> {
  return {
    ...(typeof input.title === "string" ? { title: input.title } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, "description")
      ? { description: (input.description as string | null) ?? null }
      : {}),
    ...(typeof input.status === "string" ? { status: input.status as Task["status"] } : {}),
    ...(typeof input.priority === "string" ? { priority: input.priority as Task["priority"] } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, "assigneeId")
      ? { assigneeId: (input.assigneeId as string | null) ?? null }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(input, "dueDate")
      ? { dueDate: (input.dueDate as string | null) ?? null }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(input, "startDate")
      ? { startDate: (input.startDate as string | null) ?? null }
      : {}),
    ...(typeof input.columnId === "string" ? { columnId: input.columnId } : {}),
    ...(typeof input.position === "number" ? { position: input.position } : {}),
    ...(typeof input.isMilestone === "boolean" ? { isMilestone: input.isMilestone } : {})
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id } = await context.params;
  const { data, error } = await listTaskDetails(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data.task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ data });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = taskUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await context.params;
  const { data, error } = await updateTask(id, mapTaskPatch(parsed.data as Record<string, unknown>));
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Task not found" }, { status: 404 });
  }

  await logActivity({
    actorId: profileResult.profile.id,
    activityType: "task_updated",
    message: `updated task ${data.title}`,
    projectId: data.projectId,
    taskId: data.id
  });

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id } = await context.params;
  
  // Get task details first to check project admin
  const { data: taskData } = await listTaskDetails(id);
  if (!taskData?.task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Check that user is the project admin
  const { data: boardData } = await getProjectBoard(taskData.task.projectId);
  if (!boardData?.project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (boardData.project.adminId !== profileResult.profile.id) {
    return NextResponse.json({ error: "Only the project admin can delete tasks" }, { status: 403 });
  }

  const { error } = await deleteTask(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
