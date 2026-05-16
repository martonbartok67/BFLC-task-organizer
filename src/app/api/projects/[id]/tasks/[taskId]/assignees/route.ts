import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { isAssignedToProject } from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/data-access";

/**
 * POST /api/projects/[id]/tasks/[taskId]/assignees
 * Add an assignee to a task (Phase 2B: Multiple assignees)
 */
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
  const { userId } = payload;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

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

  // Verify user is project member
  const isUserMember = await isAssignedToProject(projectId, userId);
  if (!isUserMember) {
    return NextResponse.json(
      { error: "User not in project" },
      { status: 400 }
    );
  }

  // Add assignment
  const { error: insertError } = await supabase
    .from("task_assignments")
    .insert({
      task_id: taskId,
      user_id: userId,
      assigned_by: profileResult.profile.id
    });

  if (insertError && !insertError.message.includes("duplicate")) {
    return NextResponse.json(
      { error: "Failed to assign" },
      { status: 500 }
    );
  }

  await logActivity({
    actorId: profileResult.profile.id,
    taskId,
    projectId,
    activityType: "task_updated",
    message: `added assignee to task "${task.title}"`
  });

  return NextResponse.json({
    data: { taskId, userId, message: "Assignee added" }
  });
}
