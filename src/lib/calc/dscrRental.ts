import type { OperatingExpenseAssumptions } from "@/lib/types/deal";
import { monthlyPI } from "./mortgage";
import { calculateCashFlow, type CashFlowResult } from "./cashFlow";
import { dscr } from "./dscr";
import { noiAnnual } from "./noi";

// Strategy 3: Conventional / DSCR Rental Purchase -- a permanent loan sized by down payment
// (not the two-loan BRRRR structure), qualified primarily on the property's own debt-service
// coverage rather than the borrower's income.

export interface DscrRentalTerms {
  purchasePrice: number;
  downPaymentPct: number; // decimal, e.g. 0.25
  ratePct: number; // decimal, e.g. 0.075
  termYears: number;
  closingCostsPct: number; // decimal
  minDscr?: number; // lender requirement -- defaults to 1.2, a common DSCR-loan minimum
}

export interface DscrRentalResult {
  loanAmount: number;
  downPayment: number;
  monthlyPI: number;
  cashFlow: CashFlowResult;
  cashRequired: number;
  dscrValue: number;
  minDscr: number;
  meetsMinDscr: boolean;
}

export function analyzeDscrRental(
  terms: DscrRentalTerms,
  rentMonthly: number,
  expenses: OperatingExpenseAssumptions
): DscrRentalResult {
  const downPayment = terms.purchasePrice * terms.downPaymentPct;
  const loanAmount = terms.purchasePrice - downPayment;
  const pi = monthlyPI(loanAmount, terms.ratePct, terms.termYears);
  const cashFlow = calculateCashFlow(rentMonthly, pi, expenses);
  const closingCosts = terms.purchasePrice * terms.closingCostsPct;
  const minDscr = terms.minDscr ?? 1.2;
  const dscrValue = dscr(noiAnnual(rentMonthly, expenses), pi * 12);

  return {
    loanAmount, downPayment, monthlyPI: pi, cashFlow,
    cashRequired: downPayment + closingCosts,
    dscrValue, minDscr, meetsMinDscr: dscrValue >= minDscr,
  };
}
