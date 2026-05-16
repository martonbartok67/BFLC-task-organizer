import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { isAssignedToProject } from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/data-access";

/**
 * DELETE /api/projects/[id]/tasks/[taskId]/assignees/[userId]
 * Remove assignee from task (Phase 2B: Multiple assignees)
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; taskId: string; userId: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id: projectId, taskId, userId } = await context.params;

  // Phase 5: Verify actor is project member
  const isActorMember = await isAssignedToProject(projectId, profileResult.profile.id);
  if (!isActorMember) {
    return NextResponse.json(
      { error: "User is not a member of this project" },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  // Verify task exists
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("id", taskId)
    .eq("project_id", projectId)
    .single();

  if (taskError || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Remove assignment
  const { error: deleteError } = await supabase
    .from("task_assignments")
    .delete()
    .eq("task_id", taskId)
    .eq("user_id", userId);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to remove assignee" },
      { status: 500 }
    );
  }

  await logActivity({
    actorId: profileResult.profile.id,
    taskId,
    projectId,
    activityType: "task_updated",
    message: `removed assignee from task "${task.title}"`
  });

  return NextResponse.json({
    data: { taskId, userId, message: "Assignee removed" }
  });
}
