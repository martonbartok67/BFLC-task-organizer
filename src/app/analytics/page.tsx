"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import type { ProjectProgressStats } from "@/types/domain";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<ProjectProgressStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadStats() {
    setLoading(true);
    const response = await fetch("/api/analytics/project-progress");
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not load analytics.");
      setStats([]);
      setLoading(false);
      return;
    }
    setStats(payload.data ?? []);
    setError(null);
    setLoading(false);
  }

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div>
      <SectionHeader
        title="Project Progress Analytics"
        subtitle="Track completion momentum, status balance, and milestone burndown across active projects."
      />

      {loading ? <p className="mb-3 text-sm text-flc-text-muted">Loading analytics...</p> : null}
      {error ? <p className="mb-3 text-sm text-flc-danger">{error}</p> : null}

      <div className="grid gap-4">
        {stats.map((project) => (
          <Card key={project.projectId}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-flc-text">{project.projectName}</h3>
                <p className="text-xs text-flc-text-muted">{project.totalTasks} total tasks</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-flc-text-muted">Completion</p>
                <p className="text-xl font-semibold text-flc-primary">{project.completionRate}%</p>
              </div>
            </div>

            <div className="mb-5 h-2 overflow-hidden rounded-full bg-flc-panel-muted">
              <div className="h-full bg-flc-primary" style={{ width: `${project.completionRate}%` }} />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-flc-text-muted">
                  Status Distribution
                </p>
                <div className="space-y-2">
                  {project.statusDistribution.map((item) => {
                    const width = project.totalTasks
                      ? Math.max(5, Math.round((item.count / project.totalTasks) * 100))
                      : 0;
                    return (
                      <div key={item.status}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-flc-text">{item.status.replaceAll("_", " ")}</span>
                          <span className="text-flc-text-muted">{item.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-flc-panel-muted">
                          <div className="h-full rounded-full bg-slate-500" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-flc-text-muted">
                  Milestone Burndown
                </p>
                <div className="space-y-1">
                  {project.milestoneBurndown.length === 0 ? (
                    <p className="text-xs text-flc-text-muted">No milestones yet.</p>
                  ) : (
                    project.milestoneBurndown.map((point) => (
                      <div key={point.date} className="flex items-center justify-between text-xs">
                        <span className="text-flc-text-muted">{new Date(point.date).toLocaleDateString("en-US")}</span>
                        <span className="font-semibold text-flc-text">{point.remainingMilestones}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-flc-text-muted">
                  Completion Trend
                </p>
                <div className="space-y-1">
                  {project.completionTrend.length === 0 ? (
                    <p className="text-xs text-flc-text-muted">No completed tasks yet.</p>
                  ) : (
                    project.completionTrend.map((trend) => (
                      <div key={trend.period} className="flex items-center justify-between text-xs">
                        <span className="text-flc-text-muted">{trend.period}</span>
                        <span className="font-semibold text-flc-text">{trend.completedCount}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
