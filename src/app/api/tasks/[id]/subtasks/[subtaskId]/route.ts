import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { listTaskDetails, logActivity, toggleSubtask } from "@/lib/data-access";

const schema = z.object({
  isDone: z.boolean()
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, subtaskId } = await context.params;
  const details = await listTaskDetails(id);
  if (details.error || !details.data.task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { data, error } = await toggleSubtask(id, subtaskId, parsed.data.isDone);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not update subtask" }, { status: 500 });
  }

  await logActivity({
    actorId: profileResult.profile.id,
    activityType: "subtask_toggled",
    message: `${parsed.data.isDone ? "completed" : "reopened"} subtask in ${details.data.task.title}`,
    projectId: details.data.task.projectId,
    taskId: details.data.task.id
  });

  return NextResponse.json({ data });
}
