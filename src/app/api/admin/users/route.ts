import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { isGlobalAdmin } from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/users
 * List all users with their admin status
 * Admin only
 */
export async function GET() {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const isAdmin = await isGlobalAdmin(profileResult.profile.id);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Only admins can access this endpoint" },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, is_admin, status")
      .order("is_admin", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const users = (data || []).map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      isAdmin: user.is_admin,
      status: user.status
    }));

    return NextResponse.json({
      data: {
        users
      }
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
