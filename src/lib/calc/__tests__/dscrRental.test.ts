import { describe, expect, it } from "vitest";
import { analyzeDscrRental } from "@/lib/calc/dscrRental";
import type { OperatingExpenseAssumptions } from "@/lib/types/deal";

const expenses: OperatingExpenseAssumptions = {
  taxesAnnual: 3000, insuranceAnnual: 1200, vacancyPct: 0.05, maintenancePct: 0.05, capexPct: 0.05, managementPct: 0.08,
};

describe("DSCR rental purchase", () => {
  it("sizes the loan off the down payment and computes cash required", () => {
    const result = analyzeDscrRental(
      { purchasePrice: 150000, downPaymentPct: 0.25, ratePct: 0.075, termYears: 30, closingCostsPct: 0.03 },
      1800, expenses
    );
    expect(result.downPayment).toBe(37500);
    expect(result.loanAmount).toBe(112500);
    expect(result.cashRequired).toBeCloseTo(37500 + 4500);
    expect(result.monthlyPI).toBeGreaterThan(0);
  });

  it("flags when the deal doesn't meet the lender's minimum DSCR", () => {
    const result = analyzeDscrRental(
      { purchasePrice: 150000, downPaymentPct: 0.05, ratePct: 0.09, termYears: 30, closingCostsPct: 0.03, minDscr: 1.25 },
      1400, expenses
    );
    expect(result.meetsMinDscr).toBe(false);
  });

  it("passes DSCR with a healthy down payment and rent", () => {
    const result = analyzeDscrRental(
      { purchasePrice: 150000, downPaymentPct: 0.35, ratePct: 0.07, termYears: 30, closingCostsPct: 0.03 },
      2200, expenses
    );
    expect(result.meetsMinDscr).toBe(true);
  });
});
