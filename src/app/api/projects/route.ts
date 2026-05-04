import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { createProject, listProjects, logActivity } from "@/lib/data-access";
import { projectCreateSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";

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

  // Phase 2A: Auto-add creator as admin to project_members (CRITICAL)
  const supabase = await createClient();
  const { error: memberError, data: memberData } = await supabase
    .from("project_members")
    .insert({
      project_id: data.id,
      user_id: profileResult.profile.id,
      role: "admin"
    })
    .select();

  if (memberError || !memberData || memberData.length === 0) {
    console.error("CRITICAL: Failed to add creator as admin to project_members:", {
      projectId: data.id,
      userId: profileResult.profile.id,
      error: memberError,
      data: memberData
    });
    // Return error instead of silently failing
    return NextResponse.json(
      { error: "Failed to set up project member permissions. Please try again." },
      { status: 500 }
    );
  }

  // Update project with admin_id
  const { error: updateError } = await supabase
    .from("projects")
    .update({ admin_id: profileResult.profile.id })
    .eq("id", data.id);

  if (updateError) {
    console.error("Failed to update admin_id on project:", updateError);
  }

  await logActivity({
    actorId: profileResult.profile.id,
    activityType: "project_created",
    message: `created project ${data.name}`,
    projectId: data.id
  });

  return NextResponse.json({ data }, { status: 201 });
}
