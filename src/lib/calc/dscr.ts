import { principalFromMonthlyPayment } from "./mortgage";

export function dscr(noiAnnual: number, annualDebtService: number): number {
  if (annualDebtService <= 0) return Infinity;
  return noiAnnual / annualDebtService;
}

/** Largest loan whose debt service the NOI can still cover at the required minimum DSCR. */
export function maxLoanByDscr(
  noiAnnual: number,
  minDscr: number,
  annualRatePct: number,
  termYears: number
): number {
  if (noiAnnual <= 0 || minDscr <= 0) return 0;
  const maxAnnualDebtService = noiAnnual / minDscr;
  const maxMonthlyPayment = maxAnnualDebtService / 12;
  return principalFromMonthlyPayment(maxMonthlyPayment, annualRatePct, termYears);
}
