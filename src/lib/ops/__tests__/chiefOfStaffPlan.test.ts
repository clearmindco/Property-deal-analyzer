import { describe, expect, it } from "vitest";
import { buildTodayPlan, type PlanDealInput, type PlanLeadInput } from "../chiefOfStaffPlan";

const NOW = new Date("2026-09-13T12:00:00Z");

function deal(overrides: Partial<PlanDealInput> = {}): PlanDealInput {
  return {
    id: "d1", address: "123 Main St", stage: "ANALYZING", nextAction: "Call seller",
    nextActionOwner: "US", nextContactMethod: "CALL", followUpCadence: "ONE_WEEK", dealKillers: [],
    valueArv: { conservativeArv: { value: 150000, provenance: { status: "ASSUMPTION" } }, comparables: [] },
    rehab: { lineItems: [{ category: "roof", low: 0, expected: 1000, high: 2000 }], contingencyPct: 0.1 },
    rent: { market: { likelyRent: { value: 1200, provenance: { status: "ASSUMPTION" } }, comparables: [] } },
    ...overrides,
  };
}

function lead(overrides: Partial<PlanLeadInput> = {}): PlanLeadInput {
  return {
    id: "l1", sellerName: "Jane Seller", status: "TALKING", leadType: "DIRECT_SELLER",
    nextAction: "Text back", nextActionOwner: "US", nextContactMethod: "TEXT",
    nextFollowUpAt: new Date("2099-01-01"), lastContactAt: NOW,
    ...overrides,
  };
}

describe("buildTodayPlan", () => {
  it("puts an overdue lead follow-up in urgent", () => {
    const plan = buildTodayPlan([], [lead({ nextFollowUpAt: new Date("2020-01-01") })], [], NOW);
    expect(plan.urgent.some((i) => i.label.includes("Jane Seller"))).toBe(true);
  });

  it("puts a deal with incomplete underwriting inputs in moneyMoves", () => {
    const plan = buildTodayPlan([deal({ valueArv: { comparables: [] } })], [], [], NOW);
    expect(plan.moneyMoves.some((i) => i.label === "123 Main St")).toBe(true);
  });

  it("puts a lead action owned by US in sellerMoves", () => {
    const plan = buildTodayPlan([], [lead()], [], NOW);
    expect(plan.sellerMoves.some((i) => i.label.includes("Text back"))).toBe(true);
  });

  it("puts a deal action owned by someone else in waitingOnOthers, not sellerMoves", () => {
    const plan = buildTodayPlan([deal({ nextActionOwner: "LENDER", nextAction: "Send quote" })], [], [], NOW);
    expect(plan.waitingOnOthers.some((i) => i.label.includes("LENDER"))).toBe(true);
  });

  it("passes through the marketing section untouched", () => {
    const plan = buildTodayPlan([], [], [{ label: "5 Blue Ads ready", detail: "" }], NOW);
    expect(plan.marketing).toHaveLength(1);
  });

  it("never returns more than 3 top priorities", () => {
    const leads = Array.from({ length: 10 }, (_, i) => lead({ id: `l${i}`, sellerName: `Seller ${i}`, nextFollowUpAt: new Date("2020-01-01") }));
    const plan = buildTodayPlan([], leads, [], NOW);
    expect(plan.topPriorities.length).toBeLessThanOrEqual(3);
  });

  it("excludes CLOSED/DEAD deals from the active deals section", () => {
    const plan = buildTodayPlan([deal({ stage: "CLOSED" })], [], [], NOW);
    expect(plan.deals).toHaveLength(0);
  });
});
