import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { getProjectBoard, updateProject } from "@/lib/data-access";
import { projectUpdateSchema } from "@/lib/validation";
import { getUserRoleInProject } from "@/lib/access-control";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id } = await context.params;
  const { data, error } = await getProjectBoard(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data.project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Phase 2A: Filter tasks based on user role
  const userRole = await getUserRoleInProject(id, profileResult.profile.id);
  
  let filteredTasks = data.tasks;
  if (userRole === "member") {
    // Members see only: own assigned tasks + unassigned tasks
    filteredTasks = data.tasks.filter(
      (task) =>
        task.assigneeId === profileResult.profile.id ||
        task.assigneeId === null
    );
  }

  // Add UI helper fields
  const tasksWithHelpers = filteredTasks.map((task) => ({
    ...task,
    isUnassigned: task.assigneeId === null,
    canClaim: userRole === "member" && task.assigneeId === null
  }));

  return NextResponse.json({
    data: {
      ...data,
      tasks: tasksWithHelpers,
      userRole
    }
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = projectUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await context.params;
  const { data, error } = await updateProject(id, parsed.data);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}
