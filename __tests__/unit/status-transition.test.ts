import { isValidStatusTransition } from "@/lib/task-status";

describe("isValidStatusTransition", () => {
  it("allows expected transitions and blocks invalid jumps", () => {
    expect(isValidStatusTransition("todo", "in_progress")).toBe(true);
    expect(isValidStatusTransition("review", "done")).toBe(true);
    expect(isValidStatusTransition("backlog", "done")).toBe(false);
  });
});
