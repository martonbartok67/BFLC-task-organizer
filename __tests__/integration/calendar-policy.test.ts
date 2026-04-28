import { shouldApplyExternalUpdate } from "@/lib/sync-policy";

describe("calendar sync policy", () => {
  it("applies external update when external timestamp is newer", () => {
    const local = "2026-04-28T10:00:00.000Z";
    const external = "2026-04-28T10:05:00.000Z";
    expect(shouldApplyExternalUpdate(external, local)).toBe(true);
  });

  it("skips external update when local record is newer", () => {
    const local = "2026-04-28T10:05:00.000Z";
    const external = "2026-04-28T10:00:00.000Z";
    expect(shouldApplyExternalUpdate(external, local)).toBe(false);
  });
});
