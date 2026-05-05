import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { isProjectMember, isGlobalAdmin } from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id: projectId } = await context.params;

  const isMember = await isProjectMember(projectId, profileResult.profile.id);
  if (!isMember) {
    return NextResponse.json(
      { error: "User is not a member of this project" },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  // Get all assignments for this project
  const { data: assignments, error } = await supabase
    .from("project_assignments")
    .select(`id, user_id, assigned_at, profiles:user_id(id, email, full_name, is_admin)`)
    .eq("project_id", projectId)
    .order("assigned_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mappedMembers = assignments?.map((m: any) => ({
    id: m.id,
    userId: m.user_id,
    userName: m.profiles?.full_name || m.profiles?.email,
    userEmail: m.profiles?.email,
    role: m.profiles?.is_admin ? "admin" : "member",
    joinedAt: m.assigned_at
  })) ?? [];

  return NextResponse.json({ data: { projectId, members: mappedMembers } });
}
