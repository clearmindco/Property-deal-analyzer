// CMO: "Facebook Today" surface. Reuses the existing, tested computeGroupPerformance engine
// (src/lib/leadgen/groupPerformance.ts) for every classification -- this file never invents a
// second scoring method. Blue-Ad seasoning readiness stays NEEDS_INFO/COURSE_CLARIFICATION
// whenever more than one non-superseded CourseRule version exists for the 5/5/30 cadence --
// see prisma/seed.ts for why two conflicting versions exist and are both preserved.

import { computeGroupPerformance, type GroupPerformanceCounts } from "@/lib/leadgen/groupPerformance";

export interface MarketingGroupInput {
  id: string;
  name: string;
  priority: string;
  dateJoined: string | Date | null;
  counts: GroupPerformanceCounts;
}

export interface CourseRuleInput {
  key: string;
  sourceLabel: string;
  ruleText: string;
  status: string;
}

export interface MarketingTodaySummary {
  groupsPerformingWell: string[]; // group names, recommendation === "KEEP POSTING"
  groupsToStop: string[]; // recommendation === "STOP USING"
  groupsNeedingMoreData: string[]; // recommendation === "NOT ENOUGH DATA"
  blueAdReadiness: {
    status: "NEEDS_INFO_COURSE_CLARIFICATION" | "RESOLVED";
    reason: string;
    conflictingVersions: CourseRuleInput[];
  };
}

export function summarizeMarketingToday(
  groups: MarketingGroupInput[],
  courseRules: CourseRuleInput[]
): MarketingTodaySummary {
  const groupsPerformingWell: string[] = [];
  const groupsToStop: string[] = [];
  const groupsNeedingMoreData: string[] = [];

  for (const group of groups) {
    const perf = computeGroupPerformance(group.counts);
    if (perf.recommendation === "KEEP POSTING") groupsPerformingWell.push(group.name);
    else if (perf.recommendation === "STOP USING") groupsToStop.push(group.name);
    else if (perf.recommendation === "NOT ENOUGH DATA") groupsNeedingMoreData.push(group.name);
  }

  const seasoningRules = courseRules.filter((r) => r.key === "FACEBOOK_5_5_30" && r.status !== "SUPERSEDED");
  const resolved = seasoningRules.length <= 1;

  return {
    groupsPerformingWell,
    groupsToStop,
    groupsNeedingMoreData,
    blueAdReadiness: resolved
      ? {
          status: "RESOLVED",
          reason: seasoningRules[0]
            ? `Using confirmed rule: "${seasoningRules[0].ruleText}" (${seasoningRules[0].sourceLabel})`
            : "No 5/5/30 course rule stored yet -- add one under Course Rules.",
          conflictingVersions: seasoningRules,
        }
      : {
          status: "NEEDS_INFO_COURSE_CLARIFICATION",
          reason: `${seasoningRules.length} conflicting documented versions of the Facebook 5/5/30 cadence exist -- seasoning/Blue-Ad readiness stays manual until one is confirmed authoritative on the Course Rules page.`,
          conflictingVersions: seasoningRules,
        },
  };
}
