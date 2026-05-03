import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { deleteProject, getProjectBoard, updateProject } from "@/lib/data-access";
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

  return NextResponse.json({ data });
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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id } = await context.params;
  
  // Check that the user is the admin of the project
  const { data: boardData } = await getProjectBoard(id);
  if (!boardData?.project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  
  if (boardData.project.adminId !== profileResult.profile.id) {
    return NextResponse.json({ error: "Only the project admin can delete the project" }, { status: 403 });
  }

  const { error } = await deleteProject(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
