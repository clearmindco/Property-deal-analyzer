import { describe, expect, it } from "vitest";
import { summarizeMarketingToday, type MarketingGroupInput, type CourseRuleInput } from "../cmoMarketingToday";

function group(overrides: Partial<MarketingGroupInput> = {}): MarketingGroupInput {
  return {
    id: "g1", name: "Rochester Neighbors", priority: "HIGH_PRIORITY", dateJoined: new Date("2024-01-01"),
    counts: { posts: 8, responses: 31, leads: 9, qualifiedLeads: 4, calls: 2, offers: 1, contracts: 1, closedDeals: 0 },
    ...overrides,
  };
}

function courseRule(overrides: Partial<CourseRuleInput> = {}): CourseRuleInput {
  return { key: "FACEBOOK_5_5_30", sourceLabel: "CFP Facebook Tracker / Onboarding", ruleText: "Post in 5 groups, 5 days a week for 30 days.", status: "NEEDS_CLARIFICATION", ...overrides };
}

describe("summarizeMarketingToday", () => {
  it("classifies a high-performing group via the existing computeGroupPerformance engine", () => {
    const summary = summarizeMarketingToday([group()], []);
    expect(summary.groupsPerformingWell).toContain("Rochester Neighbors");
  });

  it("classifies a dead group as STOP USING", () => {
    const summary = summarizeMarketingToday(
      [group({ name: "Dead Group", counts: { posts: 6, responses: 0, leads: 0, qualifiedLeads: 0, calls: 0, offers: 0, contracts: 0, closedDeals: 0 } })],
      []
    );
    expect(summary.groupsToStop).toContain("Dead Group");
  });

  it("reports NEEDS_INFO_COURSE_CLARIFICATION when two conflicting 5/5/30 versions exist, never a computed threshold", () => {
    const summary = summarizeMarketingToday([], [
      courseRule({ sourceLabel: "CFP Facebook Tracker / Onboarding" }),
      courseRule({ sourceLabel: "Earlier Course Roadmap", ruleText: "5 Blue Ads in 5 groups per day for 30 days." }),
    ]);
    expect(summary.blueAdReadiness.status).toBe("NEEDS_INFO_COURSE_CLARIFICATION");
    expect(summary.blueAdReadiness.conflictingVersions).toHaveLength(2);
  });

  it("resolves once one version is marked SUPERSEDED, leaving exactly one authoritative rule", () => {
    const summary = summarizeMarketingToday([], [
      courseRule({ sourceLabel: "CFP Facebook Tracker / Onboarding", status: "AUTHORITATIVE" }),
      courseRule({ sourceLabel: "Earlier Course Roadmap", status: "SUPERSEDED" }),
    ]);
    expect(summary.blueAdReadiness.status).toBe("RESOLVED");
  });

  it("never invents a seasoning threshold when no course rule exists at all", () => {
    const summary = summarizeMarketingToday([], []);
    expect(summary.blueAdReadiness.status).toBe("RESOLVED");
    expect(summary.blueAdReadiness.conflictingVersions).toHaveLength(0);
  });
});
