import { DashboardView } from "@/components/dashboard/dashboard-view";

export default async function ProjectPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <DashboardView initialProjectId={projectId} />;
}
