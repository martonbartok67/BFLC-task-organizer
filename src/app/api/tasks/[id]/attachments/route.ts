import { NextResponse } from "next/server";
import { requireApiActiveProfile } from "@/lib/api-guard";
import { addAttachment, listTaskDetails, logActivity } from "@/lib/data-access";
import { createClient } from "@/lib/supabase/server";
import { attachmentCreateSchema } from "@/lib/validation";

const bucketName = "task-attachments";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profileResult = await requireApiActiveProfile();
  if ("errorResponse" in profileResult) {
    return profileResult.errorResponse;
  }

  const { id } = await context.params;
  const details = await listTaskDetails(id);
  if (details.error || !details.data.task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let attachmentPayload: {
    label: string;
    type: "file" | "link";
    storagePath?: string;
    url?: string;
  };

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    const label = String(formData.get("label") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const supabase = await createClient();
    const safeName = file.name.replace(/\s+/g, "-").toLowerCase();
    const storagePath = `${details.data.task.projectId}/${details.data.task.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file, { upsert: false, contentType: file.type || undefined });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    attachmentPayload = {
      label: label || file.name,
      type: "file",
      storagePath
    };
  } else {
    const rawPayload = await request.json().catch(() => ({}));
    const parsed = attachmentCreateSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    if (parsed.data.type === "file" && !parsed.data.storagePath) {
      return NextResponse.json({ error: "storagePath is required for file attachment" }, { status: 400 });
    }
    if (parsed.data.type === "link" && !parsed.data.url) {
      return NextResponse.json({ error: "url is required for link attachment" }, { status: 400 });
    }
    attachmentPayload = parsed.data;
  }

  const { data, error } = await addAttachment(id, profileResult.profile.id, attachmentPayload);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to save attachment" }, { status: 500 });
  }

  await logActivity({
    actorId: profileResult.profile.id,
    activityType: "attachment_added",
    message: `added attachment to task ${details.data.task.title}`,
    projectId: details.data.task.projectId,
    taskId: details.data.task.id,
    metadata: { type: attachmentPayload.type }
  });

  return NextResponse.json({ data }, { status: 201 });
}
