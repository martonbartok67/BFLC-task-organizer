import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/data-access";

/**
 * POST /api/projects/[id]/available-members/add
 * Add a user to the project
 * Single-team model: everyone can add members
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id: projectId } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const { userId } = payload;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify project exists
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify user exists
  const { data: user, error: userError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if already member
  const { data: existing } = await supabase
    .from("project_assignments")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "User already in project" },
      { status: 400 }
    );
  }

  // Add member (assigned_at will be set by database default)
  const { error: insertError } = await supabase
    .from("project_assignments")
    .insert({
      project_id: projectId,
      user_id: userId
    });

  if (insertError) {
    console.error("Insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }

  await logActivity({
    actorId: profileResult.profile.id,
    projectId,
    activityType: "member_added",
    message: `added ${user.full_name || "user"} to project`
  });

  return NextResponse.json({
    data: {
      userId,
      message: "Member added"
    }
  });
}
