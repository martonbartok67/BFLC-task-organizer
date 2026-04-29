import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { ensureFreshAccessToken, getSharedCalendarConnection } from "@/lib/calendar-sync";
import { listCalendarEvents } from "@/lib/google-calendar";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/data-access";

export async function POST() {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const connectionResult = await getSharedCalendarConnection();
  if (connectionResult.error || !connectionResult.data) {
    return NextResponse.json({ error: "Google calendar not connected" }, { status: 400 });
  }

  const connection = await ensureFreshAccessToken(connectionResult.data);
  const googleEvents = await listCalendarEvents({
    accessToken: connection.access_token,
    calendarId: connection.calendar_id,
    syncToken: connection.sync_token
  }).catch(() => null);

  if (!googleEvents) {
    return NextResponse.json({ error: "Could not pull from Google Calendar" }, { status: 500 });
  }

  const supabase = await createClient();

  // PHASE 1 CHANGE: Calendar events are now synced separately, not converted to tasks
  // This maintains sync token for future calendar event storage, but doesn't create tasks
  let synced = 0;
  let skipped = 0;

  for (const event of googleEvents.items) {
    if (!event.id || event.status === "cancelled") {
      skipped += 1;
      continue;
    }
    synced += 1;
    // TODO: In Phase 2, store calendar events in separate calendar_events table for calendar view
    // const { error } = await supabase
    //   .from("calendar_events")
    //   .upsert({
    //     external_event_id: event.id,
    //     calendar_connection_id: connection.id,
    //     title: event.summary,
    //     description: event.description,
    //     start_time: event.start.dateTime || event.start.date,
    //     end_time: event.end.dateTime || event.end.date,
    //     last_synced_at: new Date().toISOString()
    //   });
  }

  // Update sync token
  await supabase
    .from("calendar_connections")
    .update({
      sync_token: googleEvents.nextSyncToken,
      updated_at: new Date().toISOString()
    })
    .eq("id", connection.id);

  // Log activity
  await logActivity({
    actorId: profileResult.profile.id,
    activityType: "calendar_synced",
    message: `synced calendar (${synced} events, no tasks created)`,
    metadata: {
      synced,
      skipped,
      direction: "google_to_task",
      note: "Calendar events are viewed separately - no auto-task creation"
    }
  });

  return NextResponse.json({
    data: {
      totalEvents: googleEvents.items.length,
      synced,
      skipped,
      message: "Calendar synced successfully. Events are available in the calendar view."
    }
  });
}
