import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id } = await context.params;
  const supabase = await createClient();

  // Verify notification belongs to user
  const { data: notification, error: fetchError } = await supabase
    .from("notifications")
    .select("id")
    .eq("id", id)
    .eq("user_id", profileResult.profile.id)
    .single();

  if (fetchError || !notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  // Mark as read
  const { error: updateError } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", profileResult.profile.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
