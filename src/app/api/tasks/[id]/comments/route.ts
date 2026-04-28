import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { addComment, listTaskDetails, logActivity } from "@/lib/data-access";
import { extractMentions } from "@/lib/collaboration";
import { commentCreateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = commentCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await context.params;
  const details = await listTaskDetails(id);
  if (details.error || !details.data.task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const mentions = extractMentions(parsed.data.body);
  const { data, error } = await addComment(
    id,
    profileResult.profile.id,
    parsed.data.body,
    mentions
  );
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not create comment" }, { status: 500 });
  }

  await logActivity({
    actorId: profileResult.profile.id,
    activityType: "comment_added",
    message: `commented on task ${details.data.task.title}`,
    projectId: details.data.task.projectId,
    taskId: details.data.task.id,
    metadata: { mentions }
  });

  return NextResponse.json({ data }, { status: 201 });
}
