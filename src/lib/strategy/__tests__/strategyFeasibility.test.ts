import { describe, expect, it } from "vitest";
import { evaluateAllStrategies } from "@/lib/strategy/strategyFeasibility";
import type { StrategyEngineInputs } from "@/lib/types/strategy";
import type { OperatingExpenseAssumptions } from "@/lib/types/deal";

const expenses: OperatingExpenseAssumptions = {
  taxesAnnual: 3000, insuranceAnnual: 1200, vacancyPct: 0.05, maintenancePct: 0.05, capexPct: 0.05, managementPct: 0.08,
};

function baseInputs(overrides: Partial<StrategyEngineInputs> = {}): StrategyEngineInputs {
  return {
    arv: 160000, rehabTotal: 15000, rentMonthly: 1800, expenses, askingPrice: 130000,
    hardMoneyTerms: { ratePct: 0.11, points: 2, purchaseFinancedPct: 0.9, rehabFinancedPct: 1.0, ltcCapPct: 0.9, arvLtvCapPct: 0.7, termMonths: 12 },
    refinanceTerms: { refiLtvPct: 0.75, ratePct: 0.07, termYears: 30, closingCostsPct: 0.03, minDscr: 1.2 },
    holdPeriodMonths: 6,
    requirements: { minMonthlyCashFlowPerDoor: 200, maxCashLeftInPropertyAfterRefi: 15000, minEquityCreatedPct: 0.1, reservesRequired: 5000 },
    creativeFinance: {},
    contractControl: { sourceType: "DIRECT_SELLER", assignmentPermitted: null, sellerApprovalForTerms: null, wholesalerControlsContract: null },
    targetCashFlow: 300,
    ...overrides,
  };
}

describe("strategy feasibility orchestrator -- core rule: source never predetermines structure", () => {
  it("evaluates cash and BRRRR the same way regardless of a wholesaler source", () => {
    const wholesalerSourced = evaluateAllStrategies(baseInputs({ contractControl: { sourceType: "WHOLESALER", assignmentPermitted: null, sellerApprovalForTerms: null, wholesalerControlsContract: null } }));
    const directSourced = evaluateAllStrategies(baseInputs({ contractControl: { sourceType: "DIRECT_SELLER", assignmentPermitted: null, sellerApprovalForTerms: null, wholesalerControlsContract: null } }));
    const cashWholesaler = wholesalerSourced.find((r) => r.strategy === "CASH_PURCHASE")!;
    const cashDirect = directSourced.find((r) => r.strategy === "CASH_PURCHASE")!;
    expect(cashWholesaler.monthlyCashFlow).toBe(cashDirect.monthlyCashFlow);
    expect(cashWholesaler.available).toBe(true);
  });

  it("blocks seller-cooperation structures for an unverified wholesaler source, with a numeric result never even attempted", () => {
    const results = evaluateAllStrategies(baseInputs({ contractControl: { sourceType: "WHOLESALER", assignmentPermitted: null, sellerApprovalForTerms: null, wholesalerControlsContract: null } }));
    const sellerFinance = results.find((r) => r.strategy === "SELLER_FINANCE")!;
    expect(sellerFinance.available).toBe(false);
    expect(sellerFinance.monthlyCashFlow).toBeNull();
  });

  it("evaluates seller-cooperation structures once wholesaler control and seller approval are confirmed", () => {
    const results = evaluateAllStrategies(baseInputs({
      contractControl: { sourceType: "WHOLESALER", assignmentPermitted: true, sellerApprovalForTerms: "YES", wholesalerControlsContract: "YES" },
      creativeFinance: { sellerFinance: { purchasePrice: 130000, downPayment: 13000, noteRatePct: 0.07, noteTermYears: 20 } },
    }));
    const sellerFinance = results.find((r) => r.strategy === "SELLER_FINANCE")!;
    expect(sellerFinance.available).toBe(true);
    expect(sellerFinance.monthlyCashFlow).not.toBeNull();
  });

  it("marks cash-flow-negative cash purchase as FAIL and supplies a rescue path", () => {
    const results = evaluateAllStrategies(baseInputs({ askingPrice: 200000, rentMonthly: 700, targetCashFlow: 300 }));
    const cash = results.find((r) => r.strategy === "CASH_PURCHASE")!;
    expect(cash.verdict).toBe("FAIL");
    expect(cash.rescueOptions.length).toBeGreaterThan(0);
    // All-cash has no debt to renegotiate -- only the rent lever and pass should appear.
    expect(cash.rescueOptions.some((o) => o.label.includes("Higher Rent"))).toBe(true);
  });

  it("marks strategies without supplied terms as NEEDS_INFO rather than guessing", () => {
    const results = evaluateAllStrategies(baseInputs());
    const dscr = results.find((r) => r.strategy === "DSCR_RENTAL")!;
    const wrap = results.find((r) => r.strategy === "WRAP")!;
    expect(dscr.verdict).toBe("NEEDS_INFO");
    expect(wrap.verdict).toBe("NEEDS_INFO");
  });

  it("marks not-yet-modeled strategies as NEEDS_INFO with an explicit note, not silently omitted", () => {
    const results = evaluateAllStrategies(baseInputs());
    expect(results.find((r) => r.strategy === "LEASE_OPTION")!.verdict).toBe("NEEDS_INFO");
    expect(results.find((r) => r.strategy === "LEASE_OPTION")!.reasoning[0]).toMatch(/isn't numerically modeled/i);
  });

  it("returns a result for all 11 strategies every time", () => {
    const results = evaluateAllStrategies(baseInputs());
    expect(results).toHaveLength(11);
  });
});
