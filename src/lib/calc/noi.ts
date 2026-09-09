import type { OperatingExpenseAssumptions } from "@/lib/types/deal";

export interface ExpenseBreakdown {
  taxesMonthly: number;
  insuranceMonthly: number;
  vacancyMonthly: number;
  maintenanceMonthly: number;
  capexMonthly: number;
  managementMonthly: number;
  hoaMonthly: number;
  otherMonthly: number;
  totalMonthly: number;
}

/** Vacancy/maintenance/capex/management are modeled as % of gross rent, per spec section 20. */
export function operatingExpenseBreakdown(
  rentMonthly: number,
  expenses: OperatingExpenseAssumptions
): ExpenseBreakdown {
  const taxesMonthly = expenses.taxesAnnual / 12;
  const insuranceMonthly = expenses.insuranceAnnual / 12;
  const vacancyMonthly = rentMonthly * expenses.vacancyPct;
  const maintenanceMonthly = rentMonthly * expenses.maintenancePct;
  const capexMonthly = rentMonthly * expenses.capexPct;
  const managementMonthly = rentMonthly * expenses.managementPct;
  const hoaMonthly = expenses.hoaMonthly ?? 0;
  const otherMonthly = expenses.otherMonthly ?? 0;
  const totalMonthly =
    taxesMonthly + insuranceMonthly + vacancyMonthly + maintenanceMonthly +
    capexMonthly + managementMonthly + hoaMonthly + otherMonthly;
  return {
    taxesMonthly, insuranceMonthly, vacancyMonthly, maintenanceMonthly,
    capexMonthly, managementMonthly, hoaMonthly, otherMonthly, totalMonthly,
  };
}

export function noiAnnual(rentMonthly: number, expenses: OperatingExpenseAssumptions): number {
  const breakdown = operatingExpenseBreakdown(rentMonthly, expenses);
  return rentMonthly * 12 - breakdown.totalMonthly * 12;
}

export function noiMonthly(rentMonthly: number, expenses: OperatingExpenseAssumptions): number {
  return noiAnnual(rentMonthly, expenses) / 12;
}
