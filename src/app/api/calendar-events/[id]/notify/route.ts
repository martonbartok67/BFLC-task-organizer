import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { getCalendarEventWithMembers } from "@/lib/calendar-events";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/data-access";

export async function POST(
  request: Request, 
  context: { params: Promise<{ id: string }> }
) {
  // Await the dynamic parameters array from Next.js
  const { id } = await context.params;

  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  // Used the newly awaited 'id' directly here
  const eventResult = await getCalendarEventWithMembers(id);
  if (eventResult.error || !eventResult.data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const event = eventResult.data;

  // Create notifications for all event members
  const supabase = await createClient();
  const memberIds = event.memberIds ?? [];

  if (memberIds.length === 0) {
    return NextResponse.json(
      { data: { notificationsSent: 0, message: "No members to notify" } }
    );
  }

  const notificationRecords = memberIds.map((userId) => ({
    user_id: userId,
    event_id: event.id,
    task_id: event.taskId,
    type: "event_reminder" as const,
    created_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from("notifications")
    .upsert(notificationRecords, {
      onConflict: "user_id,event_id,type"
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  await logActivity({
    actorId: profileResult.profile.id,
    activityType: "comment_added",
    message: `sent event notification for "${event.title}" to ${memberIds.length} members`,
    metadata: { eventId: event.id, memberCount: memberIds.length }
  });

  return NextResponse.json({
    data: {
      notificationsSent: memberIds.length,
      message: `Notified ${memberIds.length} members about "${event.title}"`
    }
  });
}
