import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { isAssignedToProject } from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/data-access";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; taskId: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id: projectId, taskId } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const { assigneeId } = payload;

  if (!assigneeId || typeof assigneeId !== "string") {
    return NextResponse.json(
      { error: "assigneeId is required" },
      { status: 400 }
    );
  }

  // Phase 5: Single-team model - verify actor is project member
  const isActorMember = await isAssignedToProject(projectId, profileResult.profile.id);
  if (!isActorMember) {
    return NextResponse.json(
      { error: "User is not a member of this project" },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  // Verify task exists and belongs to project
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, assignee_id")
    .eq("id", taskId)
    .eq("project_id", projectId)
    .single();

  if (taskError || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Verify assignee is a member of the project
  const isAssigneeMember = await isAssignedToProject(projectId, assigneeId);
  if (!isAssigneeMember) {
    return NextResponse.json(
      { error: "User is not a member of this project" },
      { status: 400 }
    );
  }

  // Update task assignee
  const { error: updateError } = await supabase
    .from("tasks")
    .update({ assignee_id: assigneeId, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to assign task" },
      { status: 500 }
    );
  }

  await logActivity({
    actorId: profileResult.profile.id,
    taskId,
    projectId,
    activityType: "task_updated",
    message: `assigned task "${task.title}" to member`,
    metadata: { previousAssignee: task.assignee_id, newAssignee: assigneeId }
  });

  return NextResponse.json({
    data: { taskId, assigneeId, message: "Task assigned successfully" }
  });
}
