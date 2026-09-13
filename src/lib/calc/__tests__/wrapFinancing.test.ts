import { describe, expect, it } from "vitest";
import { analyzeWrap } from "@/lib/calc/wrapFinancing";
import type { OperatingExpenseAssumptions } from "@/lib/types/deal";

const expenses: OperatingExpenseAssumptions = {
  taxesAnnual: 3000, insuranceAnnual: 1200, vacancyPct: 0.05, maintenancePct: 0.05, capexPct: 0.05, managementPct: 0.08,
};

describe("wrap financing", () => {
  it("computes the wrap payment off the full purchase price minus down payment, not the existing balance", () => {
    const result = analyzeWrap(
      { purchasePrice: 150000, downPayment: 15000, wrapRatePct: 0.07, wrapTermYears: 30, existingLoanBalance: 90000, existingLoanPayment: 650 },
      1800, expenses
    );
    expect(result.wrapPrincipal).toBe(135000);
    expect(result.monthlyWrapPayment).toBeGreaterThan(0);
    expect(result.cashRequired).toBe(15000);
  });

  it("computes the seller's spread between the wrap payment and their own existing payment", () => {
    const result = analyzeWrap(
      { purchasePrice: 150000, downPayment: 15000, wrapRatePct: 0.07, wrapTermYears: 30, existingLoanPayment: 650 },
      1800, expenses
    );
    expect(result.sellerSpreadMonthly).toBeCloseTo(result.monthlyWrapPayment - 650);
  });

  it("always flags both due-on-sale and reliance risk -- never presents a wrap as safe", () => {
    const result = analyzeWrap({ purchasePrice: 150000, downPayment: 15000, wrapRatePct: 0.07, wrapTermYears: 30 }, 1800, expenses);
    expect(result.riskFlags.some((f) => /due-on-sale/i.test(f))).toBe(true);
    expect(result.riskFlags.some((f) => /reliance/i.test(f))).toBe(true);
  });

  it("is null for seller spread when the existing payment is unknown, not a guessed number", () => {
    const result = analyzeWrap({ purchasePrice: 150000, downPayment: 15000, wrapRatePct: 0.07, wrapTermYears: 30 }, 1800, expenses);
    expect(result.sellerSpreadMonthly).toBeNull();
  });
});
