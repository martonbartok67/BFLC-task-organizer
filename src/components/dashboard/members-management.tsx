"use client";

import { useEffect, useState } from "react";
import { Shield, User, AlertCircle, Plus, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

type ProjectMember = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: "admin" | "member";
  joinedAt: string;
};

type AvailableUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * MembersManagement Component
 *
 * Displays project members and allows admins to:
 * - Add new members from available users
 * - Manage member roles (promote/demote)
 *
 * @param projectId - Project ID to manage members for
 * @param userRole - Current user's role in project ("admin" | "member" | null)
 */
export function MembersManagement({
  projectId,
  userRole
}: {
  projectId: string | null;
  userRole: "admin" | "member" | null;
}) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [addingUser, setAddingUser] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    loadMembers();
  }, [projectId]);

  async function loadMembers() {
    if (!projectId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/members`);
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Failed to load members");
        setMembers([]);
        return;
      }

      setMembers(payload.data?.members ?? []);
    } catch (e) {
      setError("Failed to load members");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableUsers() {
    if (!projectId || userRole !== "admin") {
      return;
    }

    setLoadingAvailable(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/available-members`
      );
      const payload = await response.json();

      if (response.ok) {
        setAvailableUsers(payload.data?.users ?? []);
      }
    } catch (e) {
      console.error("Failed to load available users");
    } finally {
      setLoadingAvailable(false);
    }
  }

  async function addMember(userId: string) {
    if (!projectId) {
      return;
    }

    setAddingUser(userId);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/available-members/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId })
        }
      );
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Failed to add member");
        setAddingUser(null);
        return;
      }

      // Reload members
      await loadMembers();
      setShowAddDropdown(false);
      setAddingUser(null);
      // Clear available users to force reload on next open
      setAvailableUsers([]);
    } catch (e) {
      setError("Failed to add member");
      setAddingUser(null);
    }
  }

  /**
   * Change a member's role
   * Only admins can do this
   * Prevents demoting the last admin
   */
  async function changeRole(memberId: string, newRole: "admin" | "member") {
    if (userRole !== "admin") {
      setError("Only admins can change member roles");
      return;
    }

    if (!projectId) {
      return;
    }

    setChanging(memberId);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole })
        }
      );
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Failed to change role");
        setChanging(null);
        return;
      }

      // Update local state
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      setChanging(null);
    } catch (e) {
      setError("Failed to change role");
      setChanging(null);
    }
  }

  if (!projectId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Project Members"
          subtitle="Manage team members and their roles"
        />
        {userRole === "admin" && (
          <div className="relative">
            <Button
              size="sm"
              onClick={() => {
                if (!showAddDropdown && availableUsers.length === 0) {
                  loadAvailableUsers();
                }
                setShowAddDropdown(!showAddDropdown);
              }}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Member
              <ChevronDown size={16} />
            </Button>

            {showAddDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-flc-border rounded-lg shadow-lg z-10">
                {loadingAvailable ? (
                  <div className="p-4 text-sm text-flc-text-muted text-center">
                    Loading users...
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="p-4 text-sm text-flc-text-muted text-center">
                    All users are already members
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {availableUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => addMember(user.id)}
                        disabled={addingUser === user.id}
                        className="w-full text-left px-4 py-3 hover:bg-flc-panel-muted border-b border-flc-border last:border-b-0 disabled:opacity-50 transition"
                      >
                        <p className="text-sm font-medium text-flc-text truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-flc-text-muted truncate">
                          {user.email}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {error ? (
        <Card className="bg-red-50 border-red-200 p-4 flex gap-3">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-flc-text-muted">Loading members...</p>
        </Card>
      ) : members.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-flc-text-muted">
            No members in this project yet
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-flc-border">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 hover:bg-flc-panel-muted transition"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {member.role === "admin" ? (
                      <Shield
                        size={24}
                        className="text-flc-primary bg-blue-100 p-1 rounded-lg"
                      />
                    ) : (
                      <User
                        size={24}
                        className="text-flc-text-muted bg-gray-100 p-1 rounded-lg"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-flc-text truncate">
                      {member.userName || "Unknown User"}
                    </p>
                    <p className="text-xs text-flc-text-muted truncate">
                      {member.userEmail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <Badge
                    className={
                      member.role === "admin"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {member.role === "admin" ? "Admin" : "Member"}
                  </Badge>

                  {userRole === "admin" && (
                    <Button
                      size="sm"
                      variant={
                        member.role === "admin" ? "secondary" : "primary"
                      }
                      disabled={changing === member.id}
                      onClick={() => {
                        const newRole =
                          member.role === "admin" ? "member" : "admin";
                        changeRole(member.id, newRole);
                      }}
                      className="text-xs whitespace-nowrap"
                    >
                      {changing === member.id
                        ? "Updating..."
                        : member.role === "admin"
                          ? "Demote"
                          : "Promote"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-flc-panel-muted p-4 border-t border-flc-border">
            <p className="text-xs text-flc-text-muted">
              {members.length} member{members.length !== 1 ? "s" : ""} in this
              project
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}