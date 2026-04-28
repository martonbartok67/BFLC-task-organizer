import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { createSubtask, listTaskDetails, logActivity } from "@/lib/data-access";

const schema = z.object({
  title: z.string().trim().min(1).max(180)
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
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

  const { id } = await context.params;
  const details = await listTaskDetails(id);
  if (details.error || !details.data.task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { data, error } = await createSubtask(id, parsed.data.title);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not create subtask" }, { status: 500 });
  }

  await logActivity({
    actorId: profileResult.profile.id,
    activityType: "task_updated",
    message: `added subtask to ${details.data.task.title}`,
    projectId: details.data.task.projectId,
    taskId: details.data.task.id
  });

  return NextResponse.json({ data }, { status: 201 });
}
