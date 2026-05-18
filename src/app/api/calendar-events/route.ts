import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { listCalendarEvents, createCalendarEvent } from "@/lib/calendar-events";
import { listProjects } from "@/lib/data-access";

export async function GET(request: Request) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const result = await listCalendarEvents(projectId);
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

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
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
    projectId,
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
