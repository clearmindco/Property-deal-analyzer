import { describe, expect, it } from "vitest";
import { rankStrategies } from "@/lib/strategy/bestDealRouter";
import type { StrategyResult } from "@/lib/types/strategy";

function result(overrides: Partial<StrategyResult>): StrategyResult {
  return {
    strategy: "CASH_PURCHASE", available: true, availabilityReason: "", verdict: "PASS",
    monthlyCashFlow: 100, cashRequired: 10000, risk: "MODERATE", reasoning: [], rescueOptions: [],
    ...overrides,
  };
}

describe("best deal router", () => {
  it("recommends the strategy with the best cash flow per dollar required, matching the spec's own worked example", () => {
    const results = [
      result({ strategy: "SELLER_FINANCE", monthlyCashFlow: 412, cashRequired: 9800 }),
      result({ strategy: "BRRRR", monthlyCashFlow: 327, cashRequired: 18400 }),
      result({ strategy: "CASH_PURCHASE", monthlyCashFlow: 221, cashRequired: 130000 }),
    ];
    const router = rankStrategies(results);
    expect(router.recommended?.strategy).toBe("SELLER_FINANCE");
    expect(router.backup?.strategy).toBe("BRRRR");
  });

  it("never recommends a failing or unavailable strategy", () => {
    const results = [
      result({ strategy: "SELLER_FINANCE", verdict: "FAIL", monthlyCashFlow: 900, cashRequired: 100 }),
      result({ strategy: "BRRRR", verdict: "PASS", monthlyCashFlow: 300, cashRequired: 15000 }),
    ];
    const router = rankStrategies(results);
    expect(router.recommended?.strategy).toBe("BRRRR");
  });

  it("names wholesale as the alternative exit when it's available, regardless of rank", () => {
    const results = [
      result({ strategy: "SELLER_FINANCE", monthlyCashFlow: 400, cashRequired: 10000 }),
      result({ strategy: "WHOLESALE_ASSIGNMENT", available: true, verdict: "NEEDS_INFO", monthlyCashFlow: null, cashRequired: null }),
    ];
    const router = rankStrategies(results);
    expect(router.alternativeExit?.strategy).toBe("WHOLESALE_ASSIGNMENT");
  });

  it("recommends nothing and states a clear walk-away point when no strategy passes", () => {
    const results = [
      result({ strategy: "CASH_PURCHASE", verdict: "FAIL", monthlyCashFlow: -50 }),
      result({ strategy: "BRRRR", verdict: "FAIL", monthlyCashFlow: -20 }),
    ];
    const router = rankStrategies(results);
    expect(router.recommended).toBeNull();
    expect(router.walkAwayPoint).toMatch(/no evaluated strategy/i);
  });

  it("collects deduplicated next-information-needed items from every NEEDS_INFO strategy", () => {
    const results = [
      result({ strategy: "DSCR_RENTAL", verdict: "NEEDS_INFO", monthlyCashFlow: null, reasoning: ["Enter DSCR loan terms."] }),
      result({ strategy: "WRAP", verdict: "NEEDS_INFO", monthlyCashFlow: null, reasoning: ["Enter DSCR loan terms."] }),
    ];
    const router = rankStrategies(results);
    expect(router.nextInformationNeeded).toEqual(["Enter DSCR loan terms."]);
  });
});
