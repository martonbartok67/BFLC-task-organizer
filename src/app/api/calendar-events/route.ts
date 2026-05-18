import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { listCalendarEvents, createCalendarEvent } from "@/lib/calendar-events";
import { getActiveProject } from "@/lib/data-access";

export async function GET() {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const projectResult = await getActiveProject();
  if (projectResult.error || !projectResult.data) {
    return NextResponse.json({ error: "No active project" }, { status: 400 });
  }

  const result = await listCalendarEvents(projectResult.data.id);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ data: result.data ?? [] });
}

export async function POST(request: Request) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const projectResult = await getActiveProject();
  if (projectResult.error || !projectResult.data) {
    return NextResponse.json({ error: "No active project" }, { status: 400 });
  }

  const body = await request.json();
  const { title, description, startTime, endTime, taskId, memberIds } = body;

  if (!title || !startTime || !endTime) {
    return NextResponse.json(
      { error: "Title, startTime, and endTime are required" },
      { status: 400 }
    );
  }

  const result = await createCalendarEvent({
    projectId: projectResult.data.id,
    createdBy: profileResult.profile.id,
    title,
    description: description ?? null,
    startTime,
    endTime,
    taskId: taskId ?? null,
    memberIds: memberIds ?? []
  });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ data: result.data }, { status: 201 });
}
