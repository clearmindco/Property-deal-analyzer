import { describe, expect, it } from "vitest";
import { detectBottleneck, type BottleneckInputs } from "../bottleneck";

function inputs(overrides: Partial<BottleneckInputs> = {}): BottleneckInputs {
  return {
    newLeadsThisWeek: 3, staleActiveConversations: 0, overdueFollowUps: 0,
    callsScheduled: 1, callsCompleted: 1, offersCount: 1, contractsCount: 1,
    dealsNeedingUnderwriting: 0, cfoVerdict: "APPROVE",
    ...overrides,
  };
}

describe("detectBottleneck", () => {
  it("identifies capital bottleneck first, even if everything else looks fine", () => {
    const result = detectBottleneck(inputs({ cfoVerdict: "DO_NOT_APPROVE_YET" }));
    expect(result.label).toBe("CAPITAL_BOTTLENECK");
  });

  it("identifies follow-up failure before lead-volume issues", () => {
    const result = detectBottleneck(inputs({ overdueFollowUps: 2, newLeadsThisWeek: 0 }));
    expect(result.label).toBe("FOLLOW_UP_FAILURE");
  });

  it("identifies not-enough-leads when nothing else is wrong", () => {
    const result = detectBottleneck(inputs({ newLeadsThisWeek: 0 }));
    expect(result.label).toBe("NOT_ENOUGH_LEADS");
  });

  it("identifies sellers not moving to calls", () => {
    const result = detectBottleneck(inputs({ callsScheduled: 3, callsCompleted: 0 }));
    expect(result.label).toBe("SELLERS_NOT_MOVING_TO_CALLS");
  });

  it("identifies deals failing underwriting", () => {
    const result = detectBottleneck(inputs({ dealsNeedingUnderwriting: 2, offersCount: 0 }));
    expect(result.label).toBe("DEALS_FAILING_UNDERWRITING");
  });

  it("returns NONE_IDENTIFIED when the business is healthy", () => {
    expect(detectBottleneck(inputs()).label).toBe("NONE_IDENTIFIED");
  });

  it("never returns more than one bottleneck label", () => {
    const result = detectBottleneck(inputs({ cfoVerdict: "DO_NOT_APPROVE_YET", overdueFollowUps: 5, newLeadsThisWeek: 0 }));
    expect(result.label).toBe("CAPITAL_BOTTLENECK");
  });
});
