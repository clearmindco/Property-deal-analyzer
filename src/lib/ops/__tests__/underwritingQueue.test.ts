import { describe, expect, it } from "vitest";
import { findDealsNeedingUnderwriting, type UnderwritingDealInput } from "../underwritingQueue";

function deal(overrides: Partial<UnderwritingDealInput> = {}): UnderwritingDealInput {
  return {
    id: "d1", address: "123 Main St", stage: "ANALYZING", dealKillers: [],
    valueArv: { conservativeArv: { value: 100000, provenance: { status: "ASSUMPTION" } }, comparables: [] },
    rehab: { lineItems: [{ category: "roof", low: 0, expected: 1000, high: 2000 }], contingencyPct: 0.1 },
    rent: { market: { likelyRent: { value: 1200, provenance: { status: "ASSUMPTION" } }, comparables: [] } },
    ...overrides,
  };
}

describe("findDealsNeedingUnderwriting", () => {
  it("does not flag a fully-underwritten deal", () => {
    expect(findDealsNeedingUnderwriting([deal()])).toHaveLength(0);
  });

  it("flags a deal with no ARV", () => {
    const results = findDealsNeedingUnderwriting([deal({ valueArv: { comparables: [] } })]);
    expect(results[0]!.reasons).toContain("No ARV entered yet");
  });

  it("flags a deal with no rehab line items", () => {
    const results = findDealsNeedingUnderwriting([deal({ rehab: { lineItems: [], contingencyPct: 0.1 } })]);
    expect(results[0]!.reasons).toContain("No rehab line items entered yet");
  });

  it("flags a deal with unresolved deal-killer flags", () => {
    const results = findDealsNeedingUnderwriting([
      deal({ dealKillers: [{ key: "title", label: "Unclear title", status: "STOP" }] }),
    ]);
    expect(results[0]!.reasons.some((r) => r.includes("unresolved deal-killer"))).toBe(true);
  });

  it("skips CLOSED/DEAD deals", () => {
    expect(findDealsNeedingUnderwriting([deal({ stage: "DEAD", valueArv: { comparables: [] } })])).toHaveLength(0);
  });
});
