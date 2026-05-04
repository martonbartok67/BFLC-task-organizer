import { isValidStatusTransition } from "@/lib/task-status";

describe("isValidStatusTransition", () => {
  it("allows expected transitions and blocks invalid jumps", () => {
    // Phase 1: 3-status model (todo, in_progress, done)
    expect(isValidStatusTransition("todo", "in_progress")).toBe(true);
    expect(isValidStatusTransition("in_progress", "done")).toBe(true);
    expect(isValidStatusTransition("todo", "done")).toBe(false);
    expect(isValidStatusTransition("done", "todo")).toBe(true);
  });
});
