import { createClient } from "@/lib/supabase/server";
import { refreshAccessToken } from "@/lib/google-calendar";

type CalendarConnectionRow = {
  id: string;
  calendar_id: string;
  user_id: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at: string | null;
  sync_token: string | null;
};

export async function getSharedCalendarConnection() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("provider", "google")
    // TODO: In future, filter by current user_id for per-user preferences
    // .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<CalendarConnectionRow>();

  return { data, error };
}

export async function ensureFreshAccessToken(connection: CalendarConnectionRow) {
  if (!connection.token_expires_at) {
    return connection;
  }

  const expiry = new Date(connection.token_expires_at).getTime();
  const isExpired = expiry < Date.now() + 15_000;
  if (!isExpired) {
    return connection;
  }

  const refreshed = await refreshAccessToken(connection.refresh_token);
  const tokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_connections")
    .update({
      access_token: refreshed.access_token,
      token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString()
    })
    .eq("id", connection.id)
    .select("*")
    .single<CalendarConnectionRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to refresh calendar connection");
  }

  return data;
}

/**
 * Determines if calendar events should be auto-converted to tasks
 * Currently disabled (returns false) - calendar events are viewed separately
 * In future: can be made configurable per-user
 */
export async function shouldCreateTaskFromCalendarEvent(): Promise<boolean> {
  // DISABLED: No longer auto-create tasks from calendar events
  return false;
}
