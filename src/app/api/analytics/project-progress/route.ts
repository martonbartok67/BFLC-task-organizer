import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { computeAllProjectProgress } from "@/lib/data-access";

export async function GET() {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  try {
    const data = await computeAllProjectProgress();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to compute analytics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
