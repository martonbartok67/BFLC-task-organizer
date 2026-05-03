import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { isProjectMember } from "@/lib/access-control";
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

  // Verify user is a member of the project
  const isMember = await isProjectMember(projectId, profileResult.profile.id);
  if (!isMember) {
    return NextResponse.json(
      { error: "User is not a member of this project" },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  // Get all members with their profile info
  const { data: members, error } = await supabase
    .from("project_members")
    .select(
      `
      id,
      user_id,
      role,
      joined_at,
      profiles:user_id(id, email, full_name)
      `
    )
    .eq("project_id", projectId)
    .order("joined_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map to response format
  const mappedMembers = members?.map((m: any) => ({
    id: m.id,
    userId: m.user_id,
    userName: m.profiles?.full_name || m.profiles?.email,
    userEmail: m.profiles?.email,
    role: m.role,
    joinedAt: m.joined_at
  })) ?? [];

  return NextResponse.json({
    data: {
      projectId,
      members: mappedMembers
    }
  });
}
