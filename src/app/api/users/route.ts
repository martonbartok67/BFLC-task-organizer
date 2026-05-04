import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/users
 * List all users in system (for adding to projects)
 * Returns basic profile info (id, name, email)
 */
export async function GET(request: Request) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      users: users?.map((u) => ({
        id: u.id,
        name: u.full_name || "Unknown",
        email: u.email
      })) ?? []
    }
  });
}
