// Priority Engine: "a company with 25 urgent tasks has no priorities." Deterministic scoring
// with simple, documented weights -- never an opaque AI score -- returns at most 3 items.

export interface PriorityCandidate {
  id: string;
  kind: "DEAL" | "LEAD" | "MARKETING" | "ADMIN";
  label: string;
  deadlineDate?: Date | null; // sooner = higher score
  revenueImpact?: 0 | 1 | 2 | 3;
  dealProbability?: 0 | 1 | 2 | 3;
  risk?: 0 | 1 | 2 | 3;
  isDependency?: boolean; // someone else is blocked waiting on this
}

const WEIGHTS = {
  deadlineUrgency: 3,
  revenueImpact: 2,
  dealProbability: 2,
  risk: 1,
  dependency: 2,
};

function deadlineUrgencyScore(deadline: Date | null | undefined, now: Date): number {
  if (!deadline) return 0;
  const daysUntil = (deadline.getTime() - now.getTime()) / 86_400_000;
  if (daysUntil <= 0) return 3;
  if (daysUntil <= 1) return 2.5;
  if (daysUntil <= 3) return 1.5;
  if (daysUntil <= 7) return 1;
  return 0.5;
}

function score(candidate: PriorityCandidate, now: Date): number {
  return (
    WEIGHTS.deadlineUrgency * deadlineUrgencyScore(candidate.deadlineDate, now) +
    WEIGHTS.revenueImpact * (candidate.revenueImpact ?? 0) +
    WEIGHTS.dealProbability * (candidate.dealProbability ?? 0) +
    WEIGHTS.risk * (candidate.risk ?? 0) +
    (candidate.isDependency ? WEIGHTS.dependency : 0)
  );
}

export function topPriorities(
  candidates: PriorityCandidate[],
  now: Date = new Date(),
  limit = 3
): PriorityCandidate[] {
  return [...candidates].sort((a, b) => score(b, now) - score(a, now)).slice(0, limit);
}
