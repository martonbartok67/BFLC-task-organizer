import { extractMentions } from "@/lib/collaboration";

describe("extractMentions", () => {
  it("extracts unique, normalized mentions from a comment", () => {
    const mentions = extractMentions("Hey @Anna, please pair with @peter and @anna.");
    expect(mentions).toEqual(["anna", "peter"]);
  });
});
