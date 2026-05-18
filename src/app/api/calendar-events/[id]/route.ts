import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import {
  getCalendarEventWithMembers,
  updateCalendarEvent,
  deleteCalendarEvent,
  setEventMembers
} from "@/lib/calendar-events";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const result = await getCalendarEventWithMembers(id);
  if (result.error) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ data: result.data });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const body = await request.json();
  const { title, description, startTime, endTime, taskId, memberIds } = body;

  const updateResult = await updateCalendarEvent(id, {
    title,
    description,
    startTime,
    endTime,
    taskId
  });

  if (updateResult.error) {
    return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
  }

  // Update members if provided
  if (memberIds && Array.isArray(memberIds)) {
    const memberResult = await setEventMembers(id, memberIds);
    if (memberResult.error) {
      return NextResponse.json({ error: memberResult.error.message }, { status: 500 });
    }
  }

  const result = await getCalendarEventWithMembers(id);
  return NextResponse.json({ data: result.data });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const result = await deleteCalendarEvent(id);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
