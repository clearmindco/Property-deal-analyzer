import { describe, expect, it } from "vitest";
import { calculateCashFlow, breakEvenRent } from "../cashFlow";
import { noiAnnual } from "../noi";
import type { OperatingExpenseAssumptions } from "@/lib/types/deal";

const expenses: OperatingExpenseAssumptions = {
  taxesAnnual: 3500,
  insuranceAnnual: 1100,
  vacancyPct: 0.05,
  maintenancePct: 0.05,
  capexPct: 0.05,
  managementPct: 0.08,
};

describe("calculateCashFlow", () => {
  it("subtracts mortgage P&I and every operating expense line from rent", () => {
    const result = calculateCashFlow(1800, 599, expenses);
    const manualTotal =
      result.taxesMonthly + result.insuranceMonthly + result.vacancyMonthly +
      result.maintenanceMonthly + result.capexMonthly + result.managementMonthly +
      result.hoaMonthly + result.otherMonthly;
    expect(result.netMonthlyCashFlow).toBeCloseTo(1800 - 599 - manualTotal, 5);
  });

  it("still deducts management even in a self-managed scenario (spec section 20)", () => {
    const result = calculateCashFlow(1800, 599, expenses);
    expect(result.managementMonthly).toBeGreaterThan(0);
  });
});

describe("breakEvenRent", () => {
  it("produces a rent at which cash flow is exactly zero", () => {
    const mortgagePI = 599;
    const rent = breakEvenRent(mortgagePI, expenses);
    const result = calculateCashFlow(rent, mortgagePI, expenses);
    expect(result.netMonthlyCashFlow).toBeCloseTo(0, 2);
  });
});

describe("noiAnnual", () => {
  it("is positive for the demo rent/expense mix", () => {
    expect(noiAnnual(1800, expenses)).toBeGreaterThan(0);
  });
});
