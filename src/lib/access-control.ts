import type { UserStatus, ProjectMemberRole } from "@/types/domain";
import { createClient } from "@/lib/supabase/server";

export function resolveAccessDecision(decision: "approve" | "reject"): {
  profileStatus: UserStatus;
  requestStatus: UserStatus;
} {
  if (decision === "approve") {
    return { profileStatus: "active", requestStatus: "active" };
  }
  return { profileStatus: "rejected", requestStatus: "rejected" };
}

/**
 * Get user's role in a specific project
 * Returns 'admin' | 'member' | null (if user not in project)
 */
export async function getUserRoleInProject(
  projectId: string,
  userId: string
): Promise<ProjectMemberRole | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle<{ role: ProjectMemberRole }>();

  if (error || !data) {
    return null;
  }

  return data.role;
}

/**
 * Check if user is admin in project
 */
export async function isProjectAdmin(
  projectId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserRoleInProject(projectId, userId);
  return role === "admin";
}

/**
 * Check if user is member in project (includes admins)
 */
export async function isProjectMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserRoleInProject(projectId, userId);
  return role !== null;
}
