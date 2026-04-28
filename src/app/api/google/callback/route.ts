import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/calendar?sync=missing_code", request.url));
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete("google_oauth_state");

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL("/calendar?sync=invalid_state", request.url));
  }

  const tokens = await exchangeCodeForTokens(code).catch(() => null);
  if (!tokens) {
    return NextResponse.redirect(new URL("/calendar?sync=oauth_failed", request.url));
  }

  const calendarId = process.env.GOOGLE_SHARED_CALENDAR_ID ?? "primary";
  const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  const supabase = await createClient();

  const { data: existingConnection } = await supabase
    .from("calendar_connections")
    .select("id, refresh_token")
    .eq("provider", "google")
    .limit(1)
    .maybeSingle<{ id: string; refresh_token: string }>();

  if (existingConnection) {
    await supabase
      .from("calendar_connections")
      .update({
        calendar_id: calendarId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? existingConnection.refresh_token,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq("id", existingConnection.id);
  } else {
    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL("/calendar?sync=missing_refresh_token", request.url));
    }
    await supabase.from("calendar_connections").insert({
      provider: "google",
      calendar_id: calendarId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokenExpiresAt
    });
  }

  return NextResponse.redirect(new URL("/calendar?sync=connected", request.url));
}
