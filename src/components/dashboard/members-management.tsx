"use client";

import { useEffect, useState } from "react";
import { User, AlertCircle, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

type ProjectMember = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
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
 * Displays project members and allows adding new members.
 * Single-team model: everyone can manage members.
 *
 * @param projectId - Project ID to manage members for
 */
export function MembersManagement({
  projectId
}: {
  projectId: string | null;
}) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [addingUser, setAddingUser] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadMembers();
    }
  }, [projectId]);

  async function loadMembers() {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/members`);
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Failed to load members");
        return;
      }

      setMembers(payload.data?.members ?? []);
    } catch (err) {
      setError("Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableUsers() {
    if (!projectId) return;

    setLoadingAvailable(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/available-members`
      );
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Failed to load users");
        return;
      }

      setAvailableUsers(payload.data?.users ?? []);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoadingAvailable(false);
    }
  }

  async function addMember(userId: string) {
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

      // Refresh members list
      await loadMembers();
      setShowAddDropdown(false);
      setSuccessMessage("Member added successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Failed to add member");
    } finally {
      setAddingUser(null);
    }
  }

  const handleShowDropdown = async () => {
    if (!showAddDropdown) {
      setShowAddDropdown(true);
      await loadAvailableUsers();
    } else {
      setShowAddDropdown(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Project Members"
          subtitle={`${members.length} member${members.length !== 1 ? "s" : ""}`}
        />
        <Button
          onClick={handleShowDropdown}
          variant="primary"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add Member
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200 p-4 flex gap-3">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        </Card>
      )}

      {successMessage && (
        <Card className="bg-green-50 border-green-200 p-4 flex gap-3">
          <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">{successMessage}</p>
          </div>
        </Card>
      )}

      {/* Add Member Dropdown */}
      {showAddDropdown && (
        <Card className="bg-slate-50 border-slate-200 p-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#1a1a1a]">Select user to add:</p>

            {loadingAvailable ? (
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                <p className="text-xs text-[#8a92a0]">Loading users...</p>
              </div>
            ) : availableUsers.length === 0 ? (
              <p className="text-xs text-[#8a92a0]">All users already added</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => addMember(user.id)}
                    disabled={addingUser === user.id}
                    className="w-full text-left p-3  hover:bg-white border border-slate-200 hover:border-slate-300 transition-all text-sm disabled:opacity-50"
                  >
                    <p className="font-medium text-[#1a1a1a]">{user.name}</p>
                    <p className="text-xs text-[#8a92a0]">{user.email}</p>
                    {addingUser === user.id && (
                      <div className="flex items-center gap-1 mt-1">
                        <Loader2 size={12} className="animate-spin" />
                        <p className="text-xs text-slate-500">Adding...</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Members List */}
      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 size={24} className="mx-auto animate-spin text-flc-primary" />
            <p className="text-sm text-[#8a92a0]">Loading members...</p>
          </div>
        </Card>
      ) : members.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-[#8a92a0]">No members added yet</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-flc-border">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-4 p-5 hover:bg-white-muted transition-colors"
              >
                <User
                  size={28}
                  className="text-slate-400 bg-slate-100 p-1.5  flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-flc-text truncate">
                    {member.userName}
                  </p>
                  <p className="text-xs text-[#8a92a0] truncate">
                    {member.userEmail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white-muted p-4 border-t border-[#d5dce5] text-xs text-[#8a92a0]">
            {members.length} member{members.length !== 1 ? "s" : ""} in project
          </div>
        </Card>
      )}
    </div>
  );
}
