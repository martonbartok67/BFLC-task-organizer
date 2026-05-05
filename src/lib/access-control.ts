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
 * Check if user is global admin
 * Admins can access/edit all projects and tasks
 */
export async function isGlobalAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle<{ is_admin: boolean }>();

  if (error || !data) {
    return false;
  }

  return data.is_admin === true;
}

/**
 * Check if user is assigned to a project
 * Members can see projects they're assigned to
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
 * Admins can view all projects
 * Members can view only assigned projects
 */
export async function canViewProject(
  projectId: string,
  userId: string
): Promise<boolean> {
  const [isAdmin, isAssigned] = await Promise.all([
    isGlobalAdmin(userId),
    isAssignedToProject(projectId, userId)
  ]);

  return isAdmin || isAssigned;
}

/**
 * Check if user can edit/move tasks in a project
 * Only admins can edit tasks
 * Members can only view tasks in assigned projects
 */
export async function canEditTaskInProject(
  projectId: string,
  userId: string
): Promise<boolean> {
  // Only global admins can edit tasks
  return isGlobalAdmin(userId);
}

/**
 * Check if user is creator of project
 * Used for initial project setup
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
 * Get user's role in a project
 * Returns: 'admin' | 'member' | null
 */
export async function getUserRoleInProject(
  projectId: string,
  userId: string
): Promise<"admin" | "member" | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle<{ role: "admin" | "member" }>();

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
 * Check if user is member (or admin) in project
 */
export async function isProjectMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserRoleInProject(projectId, userId);
  return role !== null;
}
