import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { getSharedCalendarConnection, ensureFreshAccessToken } from "@/lib/calendar-sync";
import { createGoogleEvent, updateGoogleEvent } from "@/lib/google-calendar";
import { createClient } from "@/lib/supabase/server";
import { listTasks, logActivity } from "@/lib/data-access";

type CalendarLinkRow = {
  id: string;
  task_id: string;
  external_event_id: string;
};

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
  const tasksResult = await listTasks();
  if (tasksResult.error || !tasksResult.data) {
    return NextResponse.json(
      { error: tasksResult.error?.message ?? "Could not fetch tasks" },
      { status: 500 }
    );
  }

  const tasks = tasksResult.data.filter((task) => Boolean(task.startDate || task.dueDate || task.isMilestone));
  const supabase = await createClient();
  const taskIds = tasks.map((task) => task.id);

  const { data: existingLinksRows } = await supabase
    .from("calendar_event_links")
    .select("id, task_id, external_event_id")
    .in("task_id", taskIds)
    .returns<CalendarLinkRow[]>();

  const linksByTaskId = new Map((existingLinksRows ?? []).map((row) => [row.task_id, row]));

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const task of tasks) {
    try {
      const existingLink = linksByTaskId.get(task.id);
      if (existingLink) {
        await updateGoogleEvent({
          accessToken: connection.access_token,
          calendarId: connection.calendar_id,
          eventId: existingLink.external_event_id,
          task
        });
        await supabase
          .from("calendar_event_links")
          .update({
            last_sync_direction: "task_to_google",
            last_synced_at: new Date().toISOString()
          })
          .eq("id", existingLink.id);
        updated += 1;
      } else {
        const event = await createGoogleEvent({
          accessToken: connection.access_token,
          calendarId: connection.calendar_id,
          task
        });
        await supabase.from("calendar_event_links").insert({
          task_id: task.id,
          calendar_connection_id: connection.id,
          external_event_id: event.id,
          last_sync_direction: "task_to_google",
          last_synced_at: new Date().toISOString()
        });
        created += 1;
      }
    } catch {
      failed += 1;
    }
  }

  await logActivity({
    actorId: profileResult.profile.id,
    activityType: "calendar_synced",
    message: `pushed tasks to Google Calendar (${created} created, ${updated} updated, ${failed} failed)`,
    metadata: { created, updated, failed, direction: "task_to_google" }
  });

  return NextResponse.json({
    data: {
      syncedTasks: tasks.length,
      created,
      updated,
      failed
    }
  });
}
