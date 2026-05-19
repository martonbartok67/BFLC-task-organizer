import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { listTaskDetails, logActivity, updateTask } from "@/lib/data-access";
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
    ...(Array.isArray(input.labels) ? { labels: input.labels as string[] } : {}),
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

  try {
    const payload = await request.json().catch(() => ({}));
    const parsed = taskUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      console.error("Task update validation error:", parsed.error.flatten());
      return NextResponse.json(
        { 
          error: "Validation error",
          details: parsed.error.flatten()
        }, 
        { status: 400 }
      );
    }

    const { id } = await context.params;
    const { data, error } = await updateTask(id, mapTaskPatch(parsed.data as Record<string, unknown>));
    if (error || !data) {
      console.error("Task update failed:", error);
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
  } catch (err) {
    console.error("Task PATCH exception:", err);
    return NextResponse.json(
      { error: "Server error", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
