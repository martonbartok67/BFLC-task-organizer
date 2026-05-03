import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { logActivity, moveTask } from "@/lib/data-access";
import { taskMoveSchema } from "@/lib/validation";
import { getUserRoleInProject } from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const parsed = taskMoveSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.taskId !== id) {
    return NextResponse.json({ error: "Payload task id mismatch" }, { status: 400 });
  }

  // Phase 2A: Check permissions
  const supabase = await createClient();
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("project_id, assignee_id")
    .eq("id", id)
    .single<{ project_id: string; assignee_id: string | null }>();

  if (taskError || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const userRole = await getUserRoleInProject(task.project_id, profileResult.profile.id);
  
  // Members can only move their own tasks
  if (userRole === "member" && task.assignee_id !== profileResult.profile.id) {
    return NextResponse.json(
      { error: "Members can only move their own tasks" },
      { status: 403 }
    );
  }

  // Non-members cannot move tasks
  if (userRole === null) {
    return NextResponse.json(
      { error: "User is not a member of this project" },
      { status: 403 }
    );
  }

  const { data, error } = await moveTask(parsed.data);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to move task" }, { status: 500 });
  }

  await logActivity({
    actorId: profileResult.profile.id,
    activityType: "task_moved",
    message: `moved task ${data.title} to ${data.status}`,
    projectId: data.projectId,
    taskId: data.id,
    metadata: {
      toColumnId: parsed.data.toColumnId,
      toStatus: parsed.data.toStatus,
      toIndex: parsed.data.toIndex
    }
  });

  return NextResponse.json({ data });
}
