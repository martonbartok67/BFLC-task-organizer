import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const statePayload = {
    userId: profileResult.profile.id,
    ts: Date.now(),
    nonce: crypto.randomUUID()
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/"
  });

  const url = getGoogleAuthUrl(state);
  return NextResponse.redirect(url);
}
