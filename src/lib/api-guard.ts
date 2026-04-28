import { NextResponse } from "next/server";
import { getCurrentProfile, getSessionUser } from "@/lib/auth";

export async function requireApiUser() {
  const { user } = await getSessionUser();
  if (!user) {
    return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}

export async function requireApiActiveProfile() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (profile.status !== "active") {
    return {
      errorResponse: NextResponse.json({ error: "Access pending approval" }, { status: 403 })
    };
  }
  return { profile };
}
