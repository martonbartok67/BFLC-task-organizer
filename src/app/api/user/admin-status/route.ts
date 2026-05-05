import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { isGlobalAdmin } from "@/lib/access-control";

/**
 * GET /api/user/admin-status
 * Returns current user's admin status
 */
export async function GET() {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const isAdmin = await isGlobalAdmin(profileResult.profile.id);

  return NextResponse.json({
    data: {
      userId: profileResult.profile.id,
      isAdmin,
      email: profileResult.profile.email,
      fullName: profileResult.profile.fullName
    }
  });
}
