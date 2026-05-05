import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isGlobalAdmin } from "@/lib/access-control";
import { getCurrentProfile } from "@/lib/auth";
import { AdminManagementView } from "@/components/admin/admin-management-view";

export default async function AdminPage() {
  // Check if user is authenticated and is an admin
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/");
  }

  const admin = await isGlobalAdmin(profile.id);
  if (!admin) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <AdminManagementView />
    </div>
  );
}
