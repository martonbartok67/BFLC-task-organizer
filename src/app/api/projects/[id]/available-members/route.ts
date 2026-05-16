import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { isAssignedToProject } from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/projects/[id]/available-members
 * List all users in system who are NOT yet members of this project
 * Phase 5: All project members can view available members
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id: projectId } = await context.params;

  // Phase 5: Verify user is project member
  const isMember = await isAssignedToProject(projectId, profileResult.profile.id);
  if (!isMember) {
    return NextResponse.json(
      { error: "User is not a member of this project" },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  // Get all users
  const { data: allUsers, error: usersError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name", { ascending: true });

  if (usersError || !allUsers) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }

  // Get current project members
  const { data: currentMembers, error: membersError } = await supabase
    .from("project_assignments")
    .select("user_id")
    .eq("project_id", projectId);

  if (membersError) {
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }

  const memberIds = new Set(currentMembers?.map((m) => m.user_id) ?? []);

  // Filter to users NOT in project
  const availableUsers = allUsers.filter((user) => !memberIds.has(user.id));

  return NextResponse.json({
    data: {
      users: availableUsers.map((u) => ({
        id: u.id,
        name: u.full_name || "Unknown",
        email: u.email
      }))
    }
  });
}
