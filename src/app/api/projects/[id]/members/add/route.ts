import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { isProjectAdmin } from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/data-access";

/**
 * POST /api/projects/[id]/members
 * Add a user to project as member
 * Only admins can do this
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

  const isAdmin = await isProjectAdmin(projectId, profileResult.profile.id);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Only admins can add members" },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  // Check if user already in project
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

  // Verify user exists
  const { data: user } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", userId)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Add member
  const { error: insertError } = await supabase.from("project_assignments").insert({
    project_id: projectId,
    user_id: userId,

  });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }

  await logActivity({
    actorId: profileResult.profile.id,
    projectId,
    activityType: "member_added",
    message: `added ${user.full_name || user.email} to project`
  });

  return NextResponse.json({
    data: {
      projectId,
      userId,
      name: user.full_name,
      email: user.email,
      message: "Member added"
    }
  });
}
