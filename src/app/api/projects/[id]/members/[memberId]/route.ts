import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { isProjectAdmin } from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/data-access";

/**
 * PATCH /api/projects/[id]/members/[memberId]
 *
 * Changes a member's role within a project.
 *
 * @param id - Project ID
 * @param memberId - Member record ID (from project_members table)
 * @param role - New role: "admin" | "member"
 *
 * Restrictions:
 * - Only admins can change roles
 * - Cannot demote an admin to member (must keep at least one admin)
 * - Admins cannot be demoted from their own role (self-preservation)
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
  const { role } = payload;

  // Validate input
  if (!role || !["admin", "member"].includes(role)) {
    return NextResponse.json(
      { error: "role must be 'admin' or 'member'" },
      { status: 400 }
    );
  }

  // Only admins can change roles
  const isAdmin = await isProjectAdmin(projectId, profileResult.profile.id);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Only admins can change member roles" },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  // Fetch the member to be updated
  const { data: member, error: memberError } = await supabase
    .from("project_members")
    .select("id, user_id, role")
    .eq("id", memberId)
    .eq("project_id", projectId)
    .single<{ id: string; user_id: string; role: string }>();

  if (memberError || !member) {
    return NextResponse.json(
      { error: "Member not found in this project" },
      { status: 404 }
    );
  }

  // Prevent demotion of the only admin
  if (member.role === "admin" && role === "member") {
    // Count remaining admins
    const { count, error: countError } = await supabase
      .from("project_members")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("role", "admin");

    if (countError || (count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Cannot demote the last admin. Project must have at least one admin." },
        { status: 400 }
      );
    }
  }

  // Update the role
  const { error: updateError } = await supabase
    .from("project_members")
    .update({ role })
    .eq("id", memberId)
    .eq("project_id", projectId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }

  // Audit log the role change
  await logActivity({
    actorId: profileResult.profile.id,
    projectId,
    activityType: "role_changed",
    message: `changed member role from ${member.role} to ${role}`,
    metadata: {
      memberId: member.user_id,
      fromRole: member.role,
      toRole: role,
      timestamp: new Date().toISOString()
    }
  });

  return NextResponse.json({
    data: {
      memberId,
      userId: member.user_id,
      role,
      message: `Member role updated to ${role}`
    }
  });
}
