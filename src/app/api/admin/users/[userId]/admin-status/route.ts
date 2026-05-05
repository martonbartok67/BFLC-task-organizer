import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { isGlobalAdmin } from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/data-access";

/**
 * PATCH /api/admin/users/[userId]/admin-status
 * Update a user's admin status
 * Admin only
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const isAdmin = await isGlobalAdmin(profileResult.profile.id);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Only admins can update user status" },
      { status: 403 }
    );
  }

  const { userId } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const { isAdmin: newAdminStatus } = payload;

  if (typeof newAdminStatus !== "boolean") {
    return NextResponse.json(
      { error: "isAdmin must be a boolean" },
      { status: 400 }
    );
  }

  // Prevent self-demotion
  if (userId === profileResult.profile.id && !newAdminStatus) {
    return NextResponse.json(
      { error: "You cannot remove your own admin status" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Verify user exists
  const { data: user, error: fetchError } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Update admin status
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_admin: newAdminStatus })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update admin status" },
      { status: 500 }
    );
  }

  // Log activity
  await logActivity({
    actorId: profileResult.profile.id,
    projectId: undefined,
    activityType: "role_changed",
    message: `changed ${user.full_name || user.email} admin status to ${newAdminStatus ? "admin" : "member"}`
  });

  return NextResponse.json({
    data: {
      user: {
        id: userId,
        fullName: user.full_name,
        email: user.email,
        isAdmin: newAdminStatus
      },
      message: `User is now ${newAdminStatus ? "an admin" : "a member"}`
    }
  });
}
