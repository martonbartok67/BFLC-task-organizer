import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent, CalendarEventWithMembers, Profile } from "@/types/domain";

type CalendarEventRow = {
  id: string;
  project_id: string;
  task_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type CalendarEventMemberRow = {
  event_id: string;
  user_id: string;
  profiles?: {
    id: string;
    email: string;
    full_name: string;
  };
};

function mapCalendarEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    taskId: row.task_id,
    title: row.title,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listCalendarEvents(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("project_id", projectId)
    .order("start_time", { ascending: true })
    .returns<CalendarEventRow[]>();

  if (error) {
    return { error };
  }

  return { data: (data ?? []).map(mapCalendarEvent) };
}

export async function getCalendarEventWithMembers(eventId: string): Promise<{ data?: CalendarEventWithMembers; error?: any }> {
  const supabase = await createClient();

  // Get event
  const { data: eventData, error: eventError } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", eventId)
    .single<CalendarEventRow>();

  if (eventError || !eventData) {
    return { error: eventError };
  }

  // Get members with profile info
  const { data: memberData } = await supabase
    .from("calendar_event_members")
    .select("user_id, profiles:user_id(id, email, full_name)")
    .eq("event_id", eventId)
    .returns<any[]>();

  const members: Profile[] = (memberData ?? [])
    .filter((m) => m.profiles)
    .map((m) => ({
      id: m.profiles.id,
      email: m.profiles.email,
      fullName: m.profiles.full_name,
      status: "active" as const,
      createdAt: new Date().toISOString()
    }));

  return {
    data: {
      ...mapCalendarEvent(eventData),
      members,
      memberIds: members.map((m) => m.id)
    }
  };
}

export async function createCalendarEvent(input: {
  projectId: string;
  createdBy: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  taskId?: string | null;
  memberIds?: string[];
}) {
  const supabase = await createClient();

  // Create event
  const { data: eventData, error: eventError } = await supabase
    .from("calendar_events")
    .insert({
      project_id: input.projectId,
      created_by: input.createdBy,
      title: input.title,
      description: input.description ?? null,
      start_time: input.startTime,
      end_time: input.endTime,
      task_id: input.taskId ?? null
    })
    .select("*")
    .single<CalendarEventRow>();

  if (eventError || !eventData) {
    return { error: eventError };
  }

  // Add members if provided
  if (input.memberIds && input.memberIds.length > 0) {
    const memberRecords = input.memberIds.map((userId) => ({
      event_id: eventData.id,
      user_id: userId
    }));

    await supabase.from("calendar_event_members").insert(memberRecords);
  }

  const event = mapCalendarEvent(eventData);
  return { data: event };
}

export async function updateCalendarEvent(
  eventId: string,
  input: {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    taskId?: string | null;
  }
) {
  const supabase = await createClient();

  const updates: any = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.startTime !== undefined) updates.start_time = input.startTime;
  if (input.endTime !== undefined) updates.end_time = input.endTime;
  if (input.taskId !== undefined) updates.task_id = input.taskId;

  const { data, error } = await supabase
    .from("calendar_events")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", eventId)
    .select("*")
    .single<CalendarEventRow>();

  if (error) {
    return { error };
  }

  return { data: data ? mapCalendarEvent(data) : null };
}

export async function deleteCalendarEvent(eventId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("calendar_events").delete().eq("id", eventId);

  if (error) {
    return { error };
  }

  return { data: { success: true } };
}

export async function addEventMembers(eventId: string, userIds: string[]) {
  const supabase = await createClient();

  const records = userIds.map((userId) => ({
    event_id: eventId,
    user_id: userId
  }));

  const { error } = await supabase.from("calendar_event_members").insert(records);

  if (error) {
    return { error };
  }

  return { data: { success: true } };
}

export async function removeEventMember(eventId: string, userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("calendar_event_members")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);

  if (error) {
    return { error };
  }

  return { data: { success: true } };
}

export async function setEventMembers(eventId: string, userIds: string[]) {
  const supabase = await createClient();

  // Delete all existing members
  await supabase.from("calendar_event_members").delete().eq("event_id", eventId);

  // Add new members
  if (userIds.length > 0) {
    const records = userIds.map((userId) => ({
      event_id: eventId,
      user_id: userId
    }));

    const { error } = await supabase.from("calendar_event_members").insert(records);
    if (error) {
      return { error };
    }
  }

  return { data: { success: true } };
}
