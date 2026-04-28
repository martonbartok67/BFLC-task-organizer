import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { ensureFreshAccessToken, getSharedCalendarConnection } from "@/lib/calendar-sync";
import { googleEventToTaskPatch, listCalendarEvents } from "@/lib/google-calendar";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/data-access";
import { shouldApplyExternalUpdate } from "@/lib/sync-policy";

type LinkRow = {
  id: string;
  task_id: string;
  external_event_id: string;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  updated_at: string;
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
  const googleEvents = await listCalendarEvents({
    accessToken: connection.access_token,
    calendarId: connection.calendar_id,
    syncToken: connection.sync_token
  }).catch(() => null);

  if (!googleEvents) {
    return NextResponse.json({ error: "Could not pull from Google Calendar" }, { status: 500 });
  }

  const eventIds = googleEvents.items.map((event) => event.id).filter(Boolean);
  const supabase = await createClient();
  const { data: linkRows } = await supabase
    .from("calendar_event_links")
    .select("id, task_id, external_event_id")
    .in("external_event_id", eventIds)
    .returns<LinkRow[]>();

  const linkMap = new Map((linkRows ?? []).map((link) => [link.external_event_id, link]));
  const taskIds = (linkRows ?? []).map((row) => row.task_id);
  const { data: linkedTasksRows } = await supabase
    .from("tasks")
    .select("id, title, description, updated_at")
    .in("id", taskIds)
    .returns<TaskRow[]>();
  const taskMap = new Map((linkedTasksRows ?? []).map((task) => [task.id, task]));

  const { data: fallbackProject } = await supabase
    .from("projects")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();
  const { data: fallbackColumn } = fallbackProject
    ? await supabase
        .from("board_columns")
        .select("id")
        .eq("project_id", fallbackProject.id)
        .eq("key", "todo")
        .limit(1)
        .maybeSingle<{ id: string }>()
    : { data: null };

  let created = 0;
  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const event of googleEvents.items) {
    if (!event.id || event.status === "cancelled") {
      skipped += 1;
      continue;
    }

    const existingLink = linkMap.get(event.id);
    if (existingLink) {
      const existingTask = taskMap.get(existingLink.task_id);
      if (!existingTask) {
        failed += 1;
        continue;
      }

      if (!shouldApplyExternalUpdate(event.updated ?? null, existingTask.updated_at)) {
        skipped += 1;
        continue;
      }

      const patch = googleEventToTaskPatch(event);
      const { error } = await supabase
        .from("tasks")
        .update({
          ...(patch.title ? { title: patch.title } : {}),
          ...(Object.prototype.hasOwnProperty.call(patch, "description")
            ? { description: patch.description ?? null }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(patch, "startDate")
            ? { start_date: patch.startDate ?? null }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(patch, "dueDate")
            ? { due_date: patch.dueDate ?? null }
            : {}),
          updated_at: new Date().toISOString()
        })
        .eq("id", existingTask.id);

      if (error) {
        failed += 1;
        continue;
      }

      await supabase
        .from("calendar_event_links")
        .update({
          last_sync_direction: "google_to_task",
          last_synced_at: new Date().toISOString()
        })
        .eq("id", existingLink.id);
      updated += 1;
      continue;
    }

    if (!fallbackProject || !fallbackColumn) {
      failed += 1;
      continue;
    }

    const patch = googleEventToTaskPatch(event);
    const { data: createdTask, error: taskError } = await supabase
      .from("tasks")
      .insert({
        project_id: fallbackProject.id,
        column_id: fallbackColumn.id,
        title: patch.title ?? "Google event",
        description: patch.description ?? null,
        status: "todo",
        priority: "medium",
        start_date: patch.startDate ?? null,
        due_date: patch.dueDate ?? null,
        created_by: profileResult.profile.id,
        position: 1000
      })
      .select("id")
      .single<{ id: string }>();

    if (taskError || !createdTask) {
      failed += 1;
      continue;
    }

    await supabase.from("calendar_event_links").insert({
      task_id: createdTask.id,
      calendar_connection_id: connection.id,
      external_event_id: event.id,
      last_sync_direction: "google_to_task",
      last_synced_at: new Date().toISOString()
    });
    created += 1;
  }

  await supabase
    .from("calendar_connections")
    .update({
      sync_token: googleEvents.nextSyncToken,
      updated_at: new Date().toISOString()
    })
    .eq("id", connection.id);

  await logActivity({
    actorId: profileResult.profile.id,
    activityType: "calendar_synced",
    message: `pulled calendar updates (${created} created, ${updated} updated, ${skipped} skipped)`,
    metadata: {
      created,
      updated,
      skipped,
      failed,
      direction: "google_to_task"
    }
  });

  return NextResponse.json({
    data: {
      totalEvents: googleEvents.items.length,
      created,
      updated,
      skipped,
      failed,
      nextSyncToken: googleEvents.nextSyncToken
    }
  });
}
