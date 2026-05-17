import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { getProjectBoard, updateProject } from "@/lib/data-access";
import { projectUpdateSchema } from "@/lib/validation";

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

  // Phase 5: Single-team model - all members see all tasks
  const tasksWithHelpers = data.tasks.map((task) => ({
    ...task,
    isUnassigned: task.assigneeId === null
  }));

  return NextResponse.json({
    data: {
      ...data,
      tasks: tasksWithHelpers
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
