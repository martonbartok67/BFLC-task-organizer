import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { createProject, listProjects, logActivity } from "@/lib/data-access";
import { projectCreateSchema } from "@/lib/validation";

export async function GET() {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { data, error } = await listProjects();
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
  const parsed = projectCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await createProject({
    ...parsed.data,
    createdBy: profileResult.profile.id
  });

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create project" }, { status: 500 });
  }

  await logActivity({
    actorId: profileResult.profile.id,
    activityType: "project_created",
    message: `created project ${data.name}`,
    projectId: data.id
  });

  return NextResponse.json({ data }, { status: 201 });
}
