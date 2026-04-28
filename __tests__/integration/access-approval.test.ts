import { resolveAccessDecision } from "@/lib/access-control";

describe("access approval workflow", () => {
  it("promotes pending requests to active on approval", () => {
    const result = resolveAccessDecision("approve");
    expect(result.profileStatus).toBe("active");
    expect(result.requestStatus).toBe("active");
  });

  it("moves pending requests to rejected on rejection", () => {
    const result = resolveAccessDecision("reject");
    expect(result.profileStatus).toBe("rejected");
    expect(result.requestStatus).toBe("rejected");
  });
});
