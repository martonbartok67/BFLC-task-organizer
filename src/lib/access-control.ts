import type { UserStatus } from "@/types/domain";
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
 * PHASE 5: SIMPLIFIED ACCESS CONTROL
 * Single-team model: Everyone has full access to all projects and tasks
 * No role-based restrictions
 */

/**
 * Check if user is assigned to a project
 */
export async function isAssignedToProject(
  projectId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("project_assignments")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Check if user can view/access a project
 * Single-team: everyone can view all projects
 */
export async function canViewProject(
  projectId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  
  // Just verify project exists and user exists
  const [project, user] = await Promise.all([
    supabase.from("projects").select("id").eq("id", projectId).maybeSingle(),
    supabase.from("profiles").select("id").eq("id", userId).maybeSingle()
  ]);

  return !!(project.data && user.data);
}

/**
 * Check if user can edit/move tasks in a project
 * Single-team: everyone can edit all tasks
 */
export async function canEditTaskInProject(
  projectId: string,
  userId: string
): Promise<boolean> {
  return canViewProject(projectId, userId);
}

/**
 * Check if user is creator of project
 */
export async function isProjectCreator(
  projectId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("projects")
    .select("created_by")
    .eq("id", projectId)
    .maybeSingle<{ created_by: string }>();

  if (error || !data) {
    return false;
  }

  return data.created_by === userId;
}

/**
 * Get user's effective role in a project
 * Single-team: everyone is "member"
 */
export async function getUserRoleInProject(
  projectId: string,
  userId: string
): Promise<"admin" | "member" | null> {
  const canView = await canViewProject(projectId, userId);
  return canView ? "member" : null;
}

/**
 * Check if user can manage a project
 * Single-team: everyone can manage
 */
export async function isProjectAdmin(
  projectId: string,
  userId: string
): Promise<boolean> {
  return canViewProject(projectId, userId);
}

/**
 * Check if user is member in project
 * Single-team: everyone is a member
 */
export async function isProjectMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  return canViewProject(projectId, userId);
}
