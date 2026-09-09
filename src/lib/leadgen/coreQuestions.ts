import { CORE_QUESTIONS, type CoreQuestion, type QualificationAnswer } from "@/lib/types/leadgen";

export function isQuestionAnswered(question: CoreQuestion, qualification: QualificationAnswer[]): boolean {
  return question.fields.some((key) => qualification.some((q) => q.key === key && q.confirmed && q.value.trim().length > 0));
}

export function coreQuestionsAnsweredCount(qualification: QualificationAnswer[]): number {
  return CORE_QUESTIONS.filter((q) => isQuestionAnswered(q, qualification)).length;
}

/**
 * Walks the 10 core questions in order and returns the first one that isn't answered yet
 * and hasn't been skipped -- never a fixed order regardless of what the seller already
 * volunteered (spec: "Never ask the seller for information they already provided").
 */
export function nextCoreQuestion(
  qualification: QualificationAnswer[],
  skippedIds: number[] = []
): CoreQuestion | null {
  return CORE_QUESTIONS.find((q) => !skippedIds.includes(q.id) && !isQuestionAnswered(q, qualification)) ?? null;
}

export function answeredQuestionIds(qualification: QualificationAnswer[]): number[] {
  return CORE_QUESTIONS.filter((q) => isQuestionAnswered(q, qualification)).map((q) => q.id);
}
