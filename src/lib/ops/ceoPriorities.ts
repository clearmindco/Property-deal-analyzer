// CEO: protects direction. Reads manually-entered CompanyObjective rows (this engine does not
// generate objectives -- that's Phase 2, once there's enough historical data to reason from)
// plus the current bottleneck, and renders the spec's "PRIMARY OBJECTIVE THIS WEEK" block.

import type { BottleneckResult } from "./bottleneck";

export interface CompanyObjectiveInput {
  period: string;
  periodLabel: string;
  type: string; // PRIMARY | SECONDARY | DO_NOT_PRIORITIZE
  text: string;
}

export interface CeoBrief {
  primaryObjectives: string[];
  secondaryObjectives: string[];
  doNotPrioritize: string[];
  bottleneck: BottleneckResult;
}

export function buildCeoBrief(
  objectives: CompanyObjectiveInput[],
  currentPeriodLabel: string,
  bottleneck: BottleneckResult
): CeoBrief {
  const current = objectives.filter((o) => o.periodLabel === currentPeriodLabel);
  return {
    primaryObjectives: current.filter((o) => o.type === "PRIMARY").map((o) => o.text),
    secondaryObjectives: current.filter((o) => o.type === "SECONDARY").map((o) => o.text),
    doNotPrioritize: current.filter((o) => o.type === "DO_NOT_PRIORITIZE").map((o) => o.text),
    bottleneck,
  };
}
