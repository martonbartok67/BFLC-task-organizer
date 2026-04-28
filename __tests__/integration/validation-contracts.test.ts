import { taskMoveSchema, taskCreateSchema } from "@/lib/validation";

describe("api validation contracts", () => {
  it("accepts valid task creation payload", () => {
    const result = taskCreateSchema.safeParse({
      projectId: "f2e4b731-d521-4ef9-b4ea-d8f8c79d7b0a",
      columnId: "d92c7c8e-a6f6-4f5f-8ded-3c9a2b9cb9e7",
      title: "Prepare milestone plan",
      status: "todo",
      priority: "high"
    });
    expect(result.success).toBe(true);
  });

  it("rejects malformed task move payload", () => {
    const result = taskMoveSchema.safeParse({
      taskId: "not-a-uuid",
      toColumnId: "also-not-a-uuid",
      toStatus: "todo",
      toIndex: -1
    });
    expect(result.success).toBe(false);
  });
});
