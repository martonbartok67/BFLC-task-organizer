import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { isProjectMember } from "@/lib/access-control";
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

  // Phase 2A: Only project members can claim tasks
  const isMember = await isProjectMember(projectId, profileResult.profile.id);
  if (!isMember) {
    return NextResponse.json(
      { error: "User is not a member of this project" },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  // Verify task exists, belongs to project, and is unassigned
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, assignee_id")
    .eq("id", taskId)
    .eq("project_id", projectId)
    .single();

  if (taskError || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.assignee_id !== null) {
    return NextResponse.json(
      { error: "Task is already assigned" },
      { status: 400 }
    );
  }

  // Assign task to current user
  const { error: updateError } = await supabase
    .from("tasks")
    .update({
      assignee_id: profileResult.profile.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to claim task" },
      { status: 500 }
    );
  }

  await logActivity({
    actorId: profileResult.profile.id,
    taskId,
    projectId,
    activityType: "task_updated",
    message: `claimed task "${task.title}"`,
    metadata: { claimedBy: profileResult.profile.id }
  });

  return NextResponse.json({
    data: {
      taskId,
      assigneeId: profileResult.profile.id,
      message: "Task claimed successfully"
    }
  });
}
