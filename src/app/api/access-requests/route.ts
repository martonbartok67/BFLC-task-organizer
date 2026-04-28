import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireApiUser } from "@/lib/api-guard";
import { getCurrentProfile } from "@/lib/auth";

const accessRequestSchema = z.object({
  note: z.string().trim().max(500).optional()
});

export async function GET() {
  const userResult = await requireApiUser();
  if ("errorResponse" in userResult) {
    return userResult.errorResponse;
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const query = supabase.from("access_requests").select("*").order("created_at", { ascending: false });
  if (profile.status !== "active") {
    query.eq("user_id", userResult.user.id);
  }
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, profileStatus: profile.status });
}

export async function POST(request: Request) {
  const userResult = await requireApiUser();
  if ("errorResponse" in userResult) {
    return userResult.errorResponse;
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = accessRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userResult.user.id)
    .single<{ email: string }>();

  const { data, error } = await supabase
    .from("access_requests")
    .upsert(
      {
        user_id: userResult.user.id,
        email: profileData?.email ?? userResult.user.email ?? "",
        note: parsed.data.note ?? null,
        status: "pending",
        reviewed_by: null,
        reviewed_at: null
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("profiles")
    .update({ status: "pending", updated_at: new Date().toISOString() })
    .eq("id", userResult.user.id)
    .neq("status", "active");

  return NextResponse.json({ data });
}
