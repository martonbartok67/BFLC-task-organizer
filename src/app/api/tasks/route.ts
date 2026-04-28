import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { createTask, listTasks, logActivity } from "@/lib/data-access";
import { taskCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") ?? undefined;
  const { data, error } = await listTasks(projectId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = taskCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await createTask({
    ...parsed.data,
    createdBy: profileResult.profile.id
  });

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not create task" }, { status: 500 });
  }

  await logActivity({
    actorId: profileResult.profile.id,
    activityType: "task_created",
    message: `created task ${data.title}`,
    projectId: data.projectId,
    taskId: data.id
  });

  return NextResponse.json({ data }, { status: 201 });
}
