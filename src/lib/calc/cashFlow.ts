import type { OperatingExpenseAssumptions } from "@/lib/types/deal";
import { operatingExpenseBreakdown } from "./noi";

export interface CashFlowResult {
  rentMonthly: number;
  mortgagePI: number;
  taxesMonthly: number;
  insuranceMonthly: number;
  vacancyMonthly: number;
  maintenanceMonthly: number;
  capexMonthly: number;
  managementMonthly: number;
  hoaMonthly: number;
  otherMonthly: number;
  netMonthlyCashFlow: number;
  netAnnualCashFlow: number;
}

/** Conservative cash flow: management is always included, even for a self-managing owner (spec section 20). */
export function calculateCashFlow(
  rentMonthly: number,
  mortgagePI: number,
  expenses: OperatingExpenseAssumptions
): CashFlowResult {
  const b = operatingExpenseBreakdown(rentMonthly, expenses);
  const netMonthlyCashFlow = rentMonthly - mortgagePI - b.totalMonthly;
  return {
    rentMonthly,
    mortgagePI,
    taxesMonthly: b.taxesMonthly,
    insuranceMonthly: b.insuranceMonthly,
    vacancyMonthly: b.vacancyMonthly,
    maintenanceMonthly: b.maintenanceMonthly,
    capexMonthly: b.capexMonthly,
    managementMonthly: b.managementMonthly,
    hoaMonthly: b.hoaMonthly,
    otherMonthly: b.otherMonthly,
    netMonthlyCashFlow,
    netAnnualCashFlow: netMonthlyCashFlow * 12,
  };
}

export function breakEvenRent(mortgagePI: number, expenses: OperatingExpenseAssumptions): number {
  // Solve rentMonthly - mortgagePI - (fixed + pctOfRent*rentMonthly) = 0
  const pctOfRent = expenses.vacancyPct + expenses.maintenancePct + expenses.capexPct + expenses.managementPct;
  const fixedMonthly = expenses.taxesAnnual / 12 + expenses.insuranceAnnual / 12 + (expenses.hoaMonthly ?? 0) + (expenses.otherMonthly ?? 0);
  const denominator = 1 - pctOfRent;
  if (denominator <= 0) return Infinity;
  return (mortgagePI + fixedMonthly) / denominator;
}
