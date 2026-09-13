import { describe, expect, it } from "vitest";
import { evaluateCapitalPosition, type CapitalDealInput } from "../cfoCapitalPosition";
import type { HardMoneyTerms } from "@/lib/types/deal";

const HM: HardMoneyTerms = {
  ratePct: 0.11, points: 2, purchaseFinancedPct: 0.9, rehabFinancedPct: 1.0,
  ltcCapPct: 0.9, arvLtvCapPct: 0.7, termMonths: 12,
};

function deal(overrides: Partial<CapitalDealInput> = {}): CapitalDealInput {
  return {
    id: "d1", address: "123 Main St", stage: "ANALYZING", askingPrice: 100000,
    valueArv: { conservativeArv: { value: 150000, provenance: { status: "ASSUMPTION" } }, comparables: [] },
    rehab: { lineItems: [{ category: "roof", low: 0, expected: 20000, high: 25000 }], contingencyPct: 0.1 },
    hardMoney: HM, holdPeriodMonths: 6,
    ...overrides,
  };
}

describe("evaluateCapitalPosition", () => {
  it("returns NEEDS_INFO when CompanySettings is missing", () => {
    const result = evaluateCapitalPosition([deal()], null);
    expect(result.verdict).toBe("NEEDS_INFO");
  });

  it("returns NEEDS_INFO when settings are incomplete", () => {
    const result = evaluateCapitalPosition([deal()], { cashOnHand: 50000, reserveMinimum: null, committedCapital: null });
    expect(result.verdict).toBe("NEEDS_INFO");
  });

  it("marks a deal with no ARV as needing info rather than assuming $0 cash required", () => {
    const result = evaluateCapitalPosition(
      [deal({ valueArv: { comparables: [] } })],
      { cashOnHand: 100000, reserveMinimum: 10000, committedCapital: 0 }
    );
    expect(result.dealRequirements[0]!.cashRequired).toBeNull();
    expect(result.dealsWithUnknownCashRequired).toBe(1);
  });

  it("approves when liquidity after active deals clears the reserve minimum", () => {
    const result = evaluateCapitalPosition([deal()], { cashOnHand: 1_000_000, reserveMinimum: 10000, committedCapital: 0 });
    expect(result.verdict).toBe("APPROVE");
  });

  it("does not approve when liquidity after active deals would breach the reserve minimum", () => {
    const result = evaluateCapitalPosition([deal()], { cashOnHand: 20000, reserveMinimum: 10000, committedCapital: 0 });
    expect(result.verdict).toBe("DO_NOT_APPROVE_YET");
  });

  it("never approves simply because the deal itself has positive projected returns -- that's a separate question from company affordability", () => {
    // Same deal, same ARV/rehab -- only the company's own cash position changes the verdict.
    const rich = evaluateCapitalPosition([deal()], { cashOnHand: 1_000_000, reserveMinimum: 10000, committedCapital: 0 });
    const poor = evaluateCapitalPosition([deal()], { cashOnHand: 20000, reserveMinimum: 10000, committedCapital: 0 });
    expect(rich.verdict).toBe("APPROVE");
    expect(poor.verdict).toBe("DO_NOT_APPROVE_YET");
  });
});
