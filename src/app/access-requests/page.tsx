"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

type AccessRequest = {
  id: string;
  user_id: string;
  email: string;
  note: string | null;
  status: "pending" | "active" | "rejected";
  created_at: string;
  reviewed_at: string | null;
};

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [profileStatus, setProfileStatus] = useState<"pending" | "active" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadRequests() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/access-requests");
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not load access requests.");
      setRequests([]);
      setLoading(false);
      return;
    }
    setRequests(payload.data ?? []);
    setProfileStatus(payload.profileStatus ?? null);
    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function review(id: string, action: "approve" | "reject") {
    const response = await fetch(`/api/access-requests/${id}/${action}`, { method: "POST" });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? `Could not ${action} request.`);
      return;
    }
    await loadRequests();
  }

  return (
    <div>
      <SectionHeader
        title="Access Requests"
        subtitle="Active team members can approve or reject pending workspace requests."
        actions={<Button onClick={loadRequests}>Refresh</Button>}
      />

      {loading ? <p className="mb-3 text-sm text-flc-text-muted">Loading...</p> : null}
      {error ? <p className="mb-3 text-sm text-flc-danger">{error}</p> : null}
      {profileStatus && profileStatus !== "active" ? (
        <p className="mb-3 text-sm text-flc-text-muted">
          Your access is currently <strong>{profileStatus}</strong>. Approval controls are available to active users.
        </p>
      ) : null}

      <div className="space-y-3">
        {requests.map((request) => (
          <Card key={request.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-sm font-semibold text-flc-text">{request.email}</p>
                  <Badge
                    tone={
                      request.status === "active"
                        ? "success"
                        : request.status === "rejected"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
                {request.note ? <p className="text-sm text-flc-text-muted">{request.note}</p> : null}
                <p className="mt-2 text-xs text-flc-text-muted">
                  Requested: {new Date(request.created_at).toLocaleString("en-US")}
                </p>
              </div>
              {profileStatus === "active" && request.status === "pending" ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => review(request.id, "approve")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => review(request.id, "reject")}>
                    Reject
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>
        ))}
        {!loading && !requests.length ? (
          <Card>
            <p className="text-sm text-flc-text-muted">No access requests found.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
