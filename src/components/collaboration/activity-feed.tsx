"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ActivityEvent } from "@/types/domain";

export function ActivityFeed({ projectId }: { projectId?: string }) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadActivity() {
      setLoading(true);
      setError(null);
      const query = projectId ? `?projectId=${projectId}` : "";
      const response = await fetch(`/api/activity${query}`);
      const payload = await response.json();
      if (!cancelled) {
        if (!response.ok) {
          setError(payload.error ?? "Could not load activity.");
          setEvents([]);
        } else {
          setEvents(payload.data ?? []);
        }
        setLoading(false);
      }
    }
    loadActivity();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <Card className="h-full p-0">
      <div className="border-b border-[#d5dce5] px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Activity Feed</h3>
        <p className="text-xs text-[#8a92a0]">Recent collaboration and workflow updates.</p>
      </div>
      <div className="flc-scroll max-h-[70vh] space-y-3 overflow-y-auto p-4">
        {loading ? <p className="text-xs text-[#8a92a0]">Loading activity...</p> : null}
        {error ? <p className="text-xs text-flc-danger">{error}</p> : null}
        {events.map((event) => (
          <article key={event.id} className=" border border-[#d5dce5] bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge>{event.activityType.replaceAll("_", " ")}</Badge>
              <span className="text-[11px] text-[#8a92a0]">
                {new Date(event.createdAt).toLocaleString("en-US")}
              </span>
            </div>
            <p className="text-sm text-[#1a1a1a]">{event.message}</p>
          </article>
        ))}
        {!loading && !events.length ? (
          <p className="text-xs text-[#8a92a0]">No activity yet.</p>
        ) : null}
      </div>
    </Card>
  );
}
