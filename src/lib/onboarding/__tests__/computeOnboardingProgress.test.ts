import { describe, expect, it } from "vitest";
import { computeOnboardingProgress, type OnboardingInputs } from "@/lib/onboarding/computeOnboardingProgress";

function zeroInputs(): OnboardingInputs {
  return {
    marketCount: 0, groupCount: 0, postedCount: 0, leadCount: 0, qualifiedLeadCount: 0,
    dealCount: 0, dealsWithNumbersCount: 0, decisionsReachedCount: 0, legalCasesStartedCount: 0,
  };
}

describe("onboarding progress", () => {
  it("starts every step undone with the first step next", () => {
    const progress = computeOnboardingProgress(zeroInputs());
    expect(progress.completedCount).toBe(0);
    expect(progress.percentComplete).toBe(0);
    expect(progress.allDone).toBe(false);
    expect(progress.nextStep?.id).toBe("market-group");
  });

  it("advances the next step as facts come in, in order", () => {
    const progress = computeOnboardingProgress({ ...zeroInputs(), marketCount: 1, groupCount: 1 });
    expect(progress.steps.find((s) => s.id === "market-group")?.done).toBe(true);
    expect(progress.nextStep?.id).toBe("first-post");
  });

  it("lets a user who skips lead-gen and creates a deal directly still progress", () => {
    const progress = computeOnboardingProgress({ ...zeroInputs(), dealCount: 1, dealsWithNumbersCount: 1, decisionsReachedCount: 1 });
    expect(progress.steps.find((s) => s.id === "first-deal")?.done).toBe(true);
    expect(progress.steps.find((s) => s.id === "run-numbers")?.done).toBe(true);
    expect(progress.steps.find((s) => s.id === "decision")?.done).toBe(true);
    // lead-gen steps are still open -- this is fine, not a blocker.
    expect(progress.steps.find((s) => s.id === "market-group")?.done).toBe(false);
  });

  it("is fully done when every required step is met, regardless of the optional legal step", () => {
    const progress = computeOnboardingProgress({
      marketCount: 1, groupCount: 1, postedCount: 1, leadCount: 1, qualifiedLeadCount: 1,
      dealCount: 1, dealsWithNumbersCount: 1, decisionsReachedCount: 1, legalCasesStartedCount: 0,
    });
    expect(progress.allDone).toBe(true);
    expect(progress.percentComplete).toBe(100);
    expect(progress.nextStep?.id).toBe("legal");
  });

  it("never counts the optional legal step toward the required percentage", () => {
    const withoutLegal = computeOnboardingProgress({
      marketCount: 1, groupCount: 1, postedCount: 1, leadCount: 1, qualifiedLeadCount: 1,
      dealCount: 1, dealsWithNumbersCount: 1, decisionsReachedCount: 1, legalCasesStartedCount: 0,
    });
    const withLegal = { ...withoutLegal };
    expect(withoutLegal.percentComplete).toBe(100);
    expect(withLegal.percentComplete).toBe(100);
  });
});
