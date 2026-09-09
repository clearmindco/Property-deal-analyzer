import { describe, expect, it } from "vitest";
import { computeGroupPerformance } from "../groupPerformance";

describe("computeGroupPerformance", () => {
  it("matches the spec's worked example: 8 posts, 14 responses, 5 qualified, 2 offers, 1 contract -> KEEP POSTING", () => {
    const result = computeGroupPerformance({
      posts: 8, responses: 14, leads: 5, qualifiedLeads: 5, calls: 5, offers: 2, contracts: 1, closedDeals: 0,
    });
    expect(result.recommendation).toBe("KEEP POSTING");
    expect(result.leadPerPost).toBeCloseTo(5 / 8, 5);
    expect(result.offerRate).toBeCloseTo(2 / 5, 5);
    expect(result.contractRate).toBeCloseTo(1 / 2, 5);
  });

  it("recommends stopping after several posts produce zero responses", () => {
    const result = computeGroupPerformance({
      posts: 10, responses: 0, leads: 0, qualifiedLeads: 0, calls: 0, offers: 0, contracts: 0, closedDeals: 0,
    });
    expect(result.recommendation).toBe("STOP USING");
  });

  it("does not judge a brand-new group with too little data", () => {
    const result = computeGroupPerformance({
      posts: 1, responses: 1, leads: 1, qualifiedLeads: 0, calls: 0, offers: 0, contracts: 0, closedDeals: 0,
    });
    expect(result.recommendation).toBe("NOT ENOUGH DATA");
  });

  it("never divides by zero", () => {
    const result = computeGroupPerformance({
      posts: 0, responses: 0, leads: 0, qualifiedLeads: 0, calls: 0, offers: 0, contracts: 0, closedDeals: 0,
    });
    expect(result.responsePerPost).toBe(0);
    expect(result.qualifiedLeadRate).toBe(0);
  });
});
