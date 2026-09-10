import type { AttorneyReviewStatus } from "@/lib/types/legal";

// Attorney Review Versioning: an attorney's approval attaches to specific clause content, not
// to a template key in the abstract. If the content changes at all, the new version can never
// silently inherit the old approval -- it must go back to "not yet reviewed" (or an explicit
// "needs re-review" state when it was previously approved) so nothing attorney-approved-looking
// ever ships without the attorney having actually seen the new words.

export function nextVersionReviewStatus(
  previousStatus: AttorneyReviewStatus,
  contentChanged: boolean
): AttorneyReviewStatus {
  if (!contentChanged) {
    // Metadata-only change (e.g. fixing a typo in a note field) -- approval can carry forward.
    return previousStatus;
  }

  if (previousStatus === "ATTORNEY_APPROVED" || previousStatus === "ATTORNEY_APPROVED_WITH_RESTRICTIONS") {
    return "NEEDS_REVIEW_UPDATE";
  }

  return "DRAFT_NOT_REVIEWED";
}
