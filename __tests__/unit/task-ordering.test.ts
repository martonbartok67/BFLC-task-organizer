import { reorderTasks } from "@/lib/task-ordering";

describe("reorderTasks", () => {
  it("moves the selected task to the expected index and resets positions", () => {
    const tasks = [
      { id: "a", position: 0 },
      { id: "b", position: 1000 },
      { id: "c", position: 2000 }
    ];

    const result = reorderTasks(tasks, "a", 2);

    expect(result.map((task) => task.id)).toEqual(["b", "c", "a"]);
    expect(result.map((task) => task.position)).toEqual([0, 1000, 2000]);
  });
});
