import { describe, expect, it } from "vitest";
import { nextVersionReviewStatus } from "@/lib/legal/templateVersioning";
import { canModifyGeneratedDocument } from "@/lib/legal/documentImmutability";

describe("attorney review versioning", () => {
  // Scenario 8: editing clause content on a new version must never silently carry forward
  // an existing attorney approval.
  it("resets an approved template to NEEDS_REVIEW_UPDATE when clause content changes", () => {
    expect(nextVersionReviewStatus("ATTORNEY_APPROVED", true)).toBe("NEEDS_REVIEW_UPDATE");
    expect(nextVersionReviewStatus("ATTORNEY_APPROVED_WITH_RESTRICTIONS", true)).toBe("NEEDS_REVIEW_UPDATE");
  });

  it("carries an approval forward when only metadata changed, not clause content", () => {
    expect(nextVersionReviewStatus("ATTORNEY_APPROVED", false)).toBe("ATTORNEY_APPROVED");
  });

  it("keeps an unreviewed draft as unreviewed after a content change", () => {
    expect(nextVersionReviewStatus("DRAFT_NOT_REVIEWED", true)).toBe("DRAFT_NOT_REVIEWED");
  });
});

describe("generated document immutability", () => {
  // Scenario 9: an executed document can never be modified in place.
  it("blocks modification of an executed document", () => {
    expect(canModifyGeneratedDocument("EXECUTED")).toBe(false);
  });

  it("blocks modification of a void document", () => {
    expect(canModifyGeneratedDocument("VOID")).toBe(false);
  });

  it("allows modification of a draft or under-review document", () => {
    expect(canModifyGeneratedDocument("DRAFT")).toBe(true);
    expect(canModifyGeneratedDocument("UNDER_REVIEW")).toBe(true);
  });
});
