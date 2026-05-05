"use client";

import { useEffect, useState } from "react";
import { Shield, User, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

type UserProfile = {
  id: string;
  email: string;
  fullName: string | null;
  isAdmin: boolean;
  status: "active" | "rejected";
};

export function AdminManagementView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users");
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Failed to load users");
        return;
      }

      setUsers(payload.data?.users ?? []);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdminStatus(userId: string, currentStatus: boolean) {
    setUpdatingUserId(userId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/admin-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !currentStatus })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Failed to update admin status");
        setUpdatingUserId(null);
        return;
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isAdmin: !currentStatus } : u
        )
      );

      setSuccessMessage(
        `${payload.data?.user?.fullName || "User"} is now ${!currentStatus ? "an admin" : "a member"}`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
      setUpdatingUserId(null);
    } catch (err) {
      setError("Failed to update admin status");
      setUpdatingUserId(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="User Management"
        subtitle="View all users and manage admin access"
      />

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

      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 size={24} className="mx-auto text-flc-primary animate-spin" />
            <p className="text-sm text-flc-text-muted">Loading users...</p>
          </div>
        </Card>
      ) : users.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-flc-text-muted">No users found</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-flc-border">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-5 hover:bg-flc-panel-muted transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {user.isAdmin ? (
                      <div className="relative">
                        <Shield
                          size={28}
                          className="text-amber-600 bg-amber-100 p-1.5 rounded-lg"
                        />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-white"></div>
                      </div>
                    ) : (
                      <User
                        size={28}
                        className="text-slate-400 bg-slate-100 p-1.5 rounded-lg"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-flc-text truncate">
                      {user.fullName || "Unknown User"}
                    </p>
                    <p className="text-xs text-flc-text-muted truncate">{user.email}</p>
                    {user.status === "rejected" && (
                      <p className="text-xs text-red-600 mt-1">Access Rejected</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <Badge
                    className={
                      user.isAdmin
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }
                  >
                    {user.isAdmin ? "Admin" : "Member"}
                  </Badge>

                  <Button
                    size="sm"
                    variant={user.isAdmin ? "secondary" : "primary"}
                    disabled={updatingUserId === user.id || user.status === "rejected"}
                    onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
                    className="text-xs whitespace-nowrap"
                  >
                    {updatingUserId === user.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin mr-1" />
                        Updating...
                      </>
                    ) : user.isAdmin ? (
                      "Revoke Admin"
                    ) : (
                      "Make Admin"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-flc-panel-muted p-4 border-t border-flc-border">
            <p className="text-xs text-flc-text-muted">
              {users.length} user{users.length !== 1 ? "s" : ""} in the system
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
