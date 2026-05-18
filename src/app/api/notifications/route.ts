import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profileResult.profile.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<any[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}
