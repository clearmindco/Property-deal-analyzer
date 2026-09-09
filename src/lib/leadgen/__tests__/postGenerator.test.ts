import { describe, expect, it } from "vitest";
import { generatePostCopy, availablePostTypes } from "../postGenerator";

describe("generatePostCopy", () => {
  it("avoids investor jargon for a plain community group", () => {
    const copy = generatePostCopy({ postType: "general_seller", groupType: "community" });
    expect(copy).not.toMatch(/cash buyer|ARV|equity|fast close|we buy houses/i);
  });

  it("allows investor language only for investor-type groups", () => {
    const copy = generatePostCopy({ postType: "general_seller", groupType: "investor" });
    expect(copy).toMatch(/cash buyer/i);
  });

  it("does not repeat a variant that was already used in this group", () => {
    const first = generatePostCopy({ postType: "referral", groupType: "community" });
    const second = generatePostCopy({ postType: "referral", groupType: "community", previousCopies: [first] });
    expect(second).not.toBe(first);
  });

  it("covers every post type from the spec with both a natural and investor variant", () => {
    for (const postType of availablePostTypes()) {
      expect(generatePostCopy({ postType, groupType: "community" }).length).toBeGreaterThan(10);
      expect(generatePostCopy({ postType, groupType: "investor" }).length).toBeGreaterThan(10);
    }
  });
});
