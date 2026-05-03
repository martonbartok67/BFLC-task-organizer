import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { assignUserToTask, logActivity } from "@/lib/data-access";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id: taskId } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const userId = payload.userId;

  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { data, error } = await assignUserToTask(taskId, userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await logActivity({
    actorId: profileResult.profile.id,
    activityType: "task_updated",
    message: `assigned user to task ${data.title}`,
    projectId: data.projectId,
    taskId: data.id
  });

  return NextResponse.json({ data });
}
