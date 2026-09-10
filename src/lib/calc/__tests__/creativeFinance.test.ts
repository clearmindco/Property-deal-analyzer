import { describe, expect, it } from "vitest";
import { analyzeHybrid, analyzeSellerFinance, analyzeSubjectTo, recommendExitStrategy } from "@/lib/calc/creativeFinance";
import type { OperatingExpenseAssumptions } from "@/lib/types/deal";

const expenses: OperatingExpenseAssumptions = {
  taxesAnnual: 3000, insuranceAnnual: 1200, vacancyPct: 0.05, maintenancePct: 0.05, capexPct: 0.05, managementPct: 0.08,
};

describe("subject-to analysis", () => {
  it("is not applicable without loan facts", () => {
    const result = analyzeSubjectTo(undefined, 150000, 1500, expenses);
    expect(result.applicable).toBe(false);
  });

  it("computes cash flow from the existing payment and always flags due-on-sale risk", () => {
    const result = analyzeSubjectTo(
      { existingLoan: { balance: 90000, monthlyPayment: 650, escrowedForTaxesInsurance: true }, cashToSeller: 5000, closingCosts: 1500 },
      150000, 1500, expenses
    );
    expect(result.applicable).toBe(true);
    expect(result.monthlyDebtService).toBe(650);
    expect(result.cashToClose).toBe(6500);
    expect(result.riskFlags.some((f) => /due-on-sale/i.test(f))).toBe(true);
    expect(result.equityCaptured).toBeCloseTo(150000 - 90000 - 6500);
  });

  it("flags a non-escrowed loan as an added responsibility", () => {
    const result = analyzeSubjectTo(
      { existingLoan: { balance: 90000, monthlyPayment: 650, escrowedForTaxesInsurance: false } },
      150000, 1500, expenses
    );
    expect(result.riskFlags.some((f) => /not escrowed/i.test(f))).toBe(true);
  });

  it("estimates the payment from balance and rate when no payment is given, and notes the assumption", () => {
    const result = analyzeSubjectTo({ existingLoan: { balance: 90000, interestRatePct: 0.05 } }, 150000, 1500, expenses);
    expect(result.applicable).toBe(true);
    expect(result.monthlyDebtService).toBeGreaterThan(0);
    expect(result.assumptionNotes.length).toBeGreaterThan(0);
  });
});

describe("seller-finance analysis", () => {
  it("is not applicable without note terms", () => {
    expect(analyzeSellerFinance(undefined, 150000, 1500, expenses).applicable).toBe(false);
  });

  it("computes the note payment and cash-to-close from down payment", () => {
    const result = analyzeSellerFinance(
      { purchasePrice: 140000, downPayment: 14000, noteRatePct: 0.07, noteTermYears: 20 },
      150000, 1500, expenses
    );
    expect(result.applicable).toBe(true);
    expect(result.cashToClose).toBe(14000);
    expect(result.equityCaptured).toBeCloseTo(150000 - 140000);
    expect(result.monthlyDebtService).toBeGreaterThan(0);
  });

  it("flags balloon risk only when a balloon is set", () => {
    const withBalloon = analyzeSellerFinance(
      { purchasePrice: 140000, downPayment: 14000, noteRatePct: 0.07, noteTermYears: 20, balloonMonths: 60 },
      150000, 1500, expenses
    );
    expect(withBalloon.riskFlags.some((f) => /balloon/i.test(f))).toBe(true);

    const noBalloon = analyzeSellerFinance(
      { purchasePrice: 140000, downPayment: 14000, noteRatePct: 0.07, noteTermYears: 20 },
      150000, 1500, expenses
    );
    expect(noBalloon.riskFlags.some((f) => /balloon/i.test(f))).toBe(false);
  });
});

describe("hybrid analysis", () => {
  it("combines existing-loan and seller-carry payments", () => {
    const result = analyzeHybrid(
      {
        existingLoan: { balance: 80000, monthlyPayment: 600 },
        sellerCarryAmount: 40000, sellerCarryRatePct: 0.06, sellerCarryTermYears: 10,
        cashToSeller: 3000,
      },
      150000, 1500, expenses
    );
    expect(result.applicable).toBe(true);
    expect(result.monthlyDebtService).toBeGreaterThan(600);
    expect(result.equityCaptured).toBeCloseTo(150000 - 80000 - 40000 - 3000);
    expect(result.riskFlags.some((f) => /due-on-sale/i.test(f))).toBe(true);
  });
});

describe("cash-on-cash return", () => {
  it("is null when essentially no cash is invested", () => {
    const result = analyzeSubjectTo({ existingLoan: { balance: 90000, monthlyPayment: 500 } }, 150000, 1800, expenses);
    expect(result.cashToClose).toBeLessThanOrEqual(1);
    expect(result.cashOnCashReturn).toBeNull();
  });

  it("is a real number when meaningful cash is invested", () => {
    const result = analyzeSellerFinance(
      { purchasePrice: 140000, downPayment: 14000, noteRatePct: 0.07, noteTermYears: 20 },
      150000, 1800, expenses
    );
    expect(result.cashOnCashReturn).not.toBeNull();
  });
});

describe("exit strategy recommendation", () => {
  it("recommends nothing when no scenario cash flows", () => {
    const badFlow = analyzeSubjectTo({ existingLoan: { balance: 90000, monthlyPayment: 5000 } }, 150000, 1500, expenses);
    const rec = recommendExitStrategy([badFlow]);
    expect(rec.recommendedLabel).toBeNull();
  });

  it("recommends the cash-flow-positive scenario needing the least cash to close", () => {
    const cheap = analyzeSubjectTo({ existingLoan: { balance: 90000, monthlyPayment: 500 }, cashToSeller: 2000 }, 150000, 1800, expenses);
    const expensive = analyzeSellerFinance(
      { purchasePrice: 140000, downPayment: 30000, noteRatePct: 0.06, noteTermYears: 20 },
      150000, 1800, expenses
    );
    const rec = recommendExitStrategy([cheap, expensive]);
    expect(rec.recommendedLabel).toBe("Subject-To");
  });
});
