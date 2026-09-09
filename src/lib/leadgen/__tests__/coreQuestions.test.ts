import { describe, expect, it } from "vitest";
import { answeredQuestionIds, coreQuestionsAnsweredCount, nextCoreQuestion } from "../coreQuestions";
import { CORE_QUESTIONS } from "@/lib/types/leadgen";
import type { QualificationAnswer } from "@/lib/types/leadgen";

function answer(key: QualificationAnswer["key"], value: string): QualificationAnswer {
  return { key, value, source: "manual", confirmed: true };
}

describe("nextCoreQuestion", () => {
  it("starts with question 1 when nothing is answered", () => {
    expect(nextCoreQuestion([])?.id).toBe(1);
    expect(coreQuestionsAnsweredCount([])).toBe(0);
  });

  it("skips a question the seller already answered out of order (spec example)", () => {
    // Seller volunteers address/reason/timeline/mortgage balance on question 1.
    const qualification = [
      answer("propertyType", "single-family"),
      answer("sellerReason", "relocating"),
      answer("timeline", "30 days"),
      answer("mortgageBalance", "$82,000"),
    ];
    const answeredIds = answeredQuestionIds(qualification);
    expect(answeredIds).toContain(1); // property overview
    expect(answeredIds).toContain(2); // why selling
    expect(answeredIds).toContain(3); // timeline
    expect(answeredIds).toContain(7); // mortgage balance
    expect(answeredIds).not.toContain(4);

    const next = nextCoreQuestion(qualification);
    expect(next?.id).toBe(4); // condition -- next unanswered in order
  });

  it("respects skipped question ids", () => {
    const next = nextCoreQuestion([], [1]);
    expect(next?.id).toBe(2);
  });

  it("returns null once all 10 are answered", () => {
    const qualification = CORE_QUESTIONS.flatMap((q) => [answer(q.fields[0]!, "known")]);
    expect(coreQuestionsAnsweredCount(qualification)).toBe(10);
    expect(nextCoreQuestion(qualification)).toBeNull();
  });
});
