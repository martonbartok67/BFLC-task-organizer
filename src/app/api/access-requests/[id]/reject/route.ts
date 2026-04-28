import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApiActiveProfile } from "@/lib/api-guard";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: requestRecord, error: requestError } = await supabase
    .from("access_requests")
    .update({
      status: "rejected",
      reviewed_by: profileResult.profile.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("*")
    .single<{ user_id: string }>();

  if (requestError || !requestRecord) {
    return NextResponse.json({ error: requestError?.message ?? "Request not found" }, { status: 404 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", requestRecord.user_id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: requestRecord });
}
