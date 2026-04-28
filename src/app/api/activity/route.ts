import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { listActivity } from "@/lib/data-access";

export async function GET(request: Request) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") ?? undefined;
  const { data, error } = await listActivity(projectId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}
