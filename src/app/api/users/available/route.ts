import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/users/available?projectId=...
 * List all users (excluding those already in project)
 * Available to all authenticated users
 */
export async function GET(request: Request) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Get all users
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name", { ascending: true });

  if (usersError) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }

  // Get users already in project
  const { data: projectMembers } = await supabase
    .from("project_assignments")
    .select("user_id")
    .eq("project_id", projectId);

  const memberIds = new Set(projectMembers?.map((m) => m.user_id) ?? []);

  // Filter: exclude existing members
  const availableUsers = users
    ?.filter((u) => !memberIds.has(u.id))
    .map((u) => ({
      id: u.id,
      name: u.full_name || u.email,
      email: u.email
    })) ?? [];

  return NextResponse.json({
    data: { users: availableUsers }
  });
}
