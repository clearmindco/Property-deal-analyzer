import type { OperatingExpenseAssumptions, RefinanceTerms } from "@/lib/types/deal";
import { maxLoanByLtv } from "./ltv";
import { maxLoanByDscr, dscr as dscrOf } from "./dscr";
import { monthlyPI } from "./mortgage";
import { noiAnnual } from "./noi";
import { calculateCashFlow } from "./cashFlow";

export interface RefinanceResult {
  arv: number;
  maxLoanByLtv: number;
  maxLoanByDscr?: number;
  refiLoanAmount: number;
  cappedBy: "ltv" | "dscr";
  refiClosingCosts: number;
  hardMoneyPayoff: number;
  cashReturnedToInvestor: number;
  originalCashInvested: number;
  cashRemainingInProperty: number;
  monthlyPI: number;
  postRefiCashFlowMonthly: number;
  postRefiDscr: number;
  equityAtRefi: number;
}

export function calculateRefinance(
  arv: number,
  refi: RefinanceTerms,
  hardMoneyPayoff: number,
  originalCashInvested: number,
  rentMonthly: number,
  expenses: OperatingExpenseAssumptions
): RefinanceResult {
  const byLtv = maxLoanByLtv(arv, refi.refiLtvPct);
  let byDscr: number | undefined;
  let refiLoanAmount = byLtv;
  let cappedBy: "ltv" | "dscr" = "ltv";

  if (refi.minDscr) {
    const noi = noiAnnual(rentMonthly, expenses);
    byDscr = maxLoanByDscr(noi, refi.minDscr, refi.ratePct, refi.termYears);
    if (byDscr < byLtv) {
      refiLoanAmount = byDscr;
      cappedBy = "dscr";
    }
  }

  const refiClosingCosts = refiLoanAmount * refi.closingCostsPct;
  const cashReturnedToInvestor = Math.max(0, refiLoanAmount - hardMoneyPayoff - refiClosingCosts);
  const cashRemainingInProperty = Math.max(0, originalCashInvested - cashReturnedToInvestor);

  const pi = monthlyPI(refiLoanAmount, refi.ratePct, refi.termYears);
  const cashFlow = calculateCashFlow(rentMonthly, pi, expenses);
  const noi = noiAnnual(rentMonthly, expenses);
  const annualDebtService = pi * 12;

  return {
    arv,
    maxLoanByLtv: byLtv,
    maxLoanByDscr: byDscr,
    refiLoanAmount,
    cappedBy,
    refiClosingCosts,
    hardMoneyPayoff,
    cashReturnedToInvestor,
    originalCashInvested,
    cashRemainingInProperty,
    monthlyPI: pi,
    postRefiCashFlowMonthly: cashFlow.netMonthlyCashFlow,
    postRefiDscr: dscrOf(noi, annualDebtService),
    equityAtRefi: arv - refiLoanAmount,
  };
}

export interface AppraisalScenario {
  appraisedValue: number;
  result: RefinanceResult;
}

export function appraisalSensitivity(
  appraisedValues: number[],
  refi: RefinanceTerms,
  hardMoneyPayoff: number,
  originalCashInvested: number,
  rentMonthly: number,
  expenses: OperatingExpenseAssumptions
): AppraisalScenario[] {
  return appraisedValues.map((v) => ({
    appraisedValue: v,
    result: calculateRefinance(v, refi, hardMoneyPayoff, originalCashInvested, rentMonthly, expenses),
  }));
}
