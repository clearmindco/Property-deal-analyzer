import { describe, expect, it } from "vitest";
import { computeRescueOptions } from "@/lib/strategy/dealRescue";
import type { OperatingExpenseAssumptions } from "@/lib/types/deal";

const expenses: OperatingExpenseAssumptions = {
  taxesAnnual: 3000, insuranceAnnual: 1200, vacancyPct: 0.05, maintenancePct: 0.05, capexPct: 0.05, managementPct: 0.08,
};

describe("deal rescue engine", () => {
  it("returns no options when the deal already meets its target -- nothing to rescue", () => {
    const options = computeRescueOptions({
      rentMonthly: 1800, expenses, targetCashFlow: 300, currentCashFlow: 350, currentDebtService: 900,
    });
    expect(options).toEqual([]);
  });

  it("matches the spec's own worked example -- $91/mo actual against a $300/mo target", () => {
    const options = computeRescueOptions({
      rentMonthly: 1800, expenses, targetCashFlow: 300, currentCashFlow: 91, currentDebtService: 900,
      debtRatePct: 0.07, debtTermYears: 30, currentDownPayment: 15000,
    });
    const labels = options.map((o) => o.label);
    expect(labels).toContain("Option B -- Better Terms");
    expect(labels).toContain("Option A -- Lower Price");
    expect(labels).toContain("Option E -- Higher Rent");
    expect(labels).toContain("Option G -- Pass");
    // Never silently proposes fixes it can't compute.
    expect(labels).not.toContain("Option D -- BRRRR");
    expect(labels).not.toContain("Option F -- Wholesale");
  });

  it("always ends with Option G -- Pass as the honest fallback", () => {
    const options = computeRescueOptions({ rentMonthly: 1500, expenses, targetCashFlow: 300, currentCashFlow: 0, currentDebtService: 900 });
    expect(options[options.length - 1]!.label).toBe("Option G -- Pass");
  });

  it("computes the required rent to hit the target at the current price and terms", () => {
    const options = computeRescueOptions({ rentMonthly: 1500, expenses, targetCashFlow: 300, currentCashFlow: 50, currentDebtService: 900 });
    const rentOption = options.find((o) => o.label === "Option E -- Higher Rent")!;
    expect(rentOption.description).toMatch(/\$[\d,]+\/mo/);
  });

  it("computes the max down payment for a stated cash ceiling", () => {
    const options = computeRescueOptions({
      rentMonthly: 1800, expenses, targetCashFlow: 300, currentCashFlow: 91, currentDebtService: 900,
      maxCashAllowed: 10000, closingCosts: 2000,
    });
    const cashOption = options.find((o) => o.label === "Option C -- Lower Cash Entry")!;
    expect(cashOption.description).toContain("8,000");
  });

  it("passes through the BRRRR ceiling and wholesale spread only when supplied", () => {
    const options = computeRescueOptions({
      rentMonthly: 1800, expenses, targetCashFlow: 300, currentCashFlow: 91, currentDebtService: 900,
      brrrMaxAcquisition: 72000, wholesaleEndBuyerMaxPrice: 90000, currentTotalAcquisitionPrice: 85000,
    });
    expect(options.find((o) => o.label === "Option D -- BRRRR")?.description).toContain("72,000");
    expect(options.find((o) => o.label === "Option F -- Wholesale")?.description).toContain("5,000");
  });

  it("is honest when the wholesale spread is negative -- never dresses up a losing spread", () => {
    const options = computeRescueOptions({
      rentMonthly: 1800, expenses, targetCashFlow: 300, currentCashFlow: 91, currentDebtService: 900,
      wholesaleEndBuyerMaxPrice: 80000, currentTotalAcquisitionPrice: 85000,
    });
    const wholesaleOption = options.find((o) => o.label === "Option F -- Wholesale")!;
    expect(wholesaleOption.description).toMatch(/no positive spread/i);
  });
});
