import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { listProjectMembers } from "@/lib/data-access";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id } = await context.params;
  const { data, error } = await listProjectMembers(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
