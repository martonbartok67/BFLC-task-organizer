import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { isGlobalAdmin } from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/data-access";

/**
 * PATCH /api/projects/[id]/members/[memberId]
 * Promote/demote a user's global admin status
 * Only global admins can do this
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id: projectId, memberId } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const { role } = payload; // "admin" | "member"

  if (!role || !["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "role must be 'admin' or 'member'" }, { status: 400 });
  }

  const actorIsAdmin = await isGlobalAdmin(profileResult.profile.id);
  if (!actorIsAdmin) {
    return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 });
  }

  const supabase = await createClient();

  // memberId here is the assignment id — look up the user_id
  const { data: assignment, error: assignError } = await supabase
    .from("project_assignments")
    .select("user_id")
    .eq("id", memberId)
    .single();

  if (assignError || !assignment) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const targetUserId = assignment.user_id;

  // Prevent last admin demotion
  if (role === "member") {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", true);

    if ((count ?? 0) <= 1 && targetUserId === profileResult.profile.id) {
      return NextResponse.json(
        { error: "Cannot demote the last admin" },
        { status: 400 }
      );
    }
  }

  // Update global is_admin flag
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_admin: role === "admin" })
    .eq("id", targetUserId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }

  await logActivity({
    actorId: profileResult.profile.id,
    projectId,
    activityType: "role_changed",
    message: `changed user role to ${role}`
  });

  return NextResponse.json({ data: { memberId, role, message: "Role updated" } });
}
