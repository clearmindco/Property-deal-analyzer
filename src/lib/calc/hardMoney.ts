import type { HardMoneyTerms } from "@/lib/types/deal";
import { maxLoanByLtc, maxLoanByLtv } from "./ltv";

export interface HardMoneyLoanResult {
  purchaseLoan: number;
  rehabLoan: number;
  totalLoan: number;
  cappedBy: "ltc" | "arv_ltv" | "min_loan" | "max_loan" | "none";
  pointsCost: number;
  feesTotal: number;
  downPayment: number;
  rehabCashRequired: number;
  cashToClose: number;
  initialMonthlyInterest: number;
  fullyDrawnMonthlyInterest: number;
  estimatedInterestDuringHold: number;
  maxTemporaryCashExposure: number;
  totalFinancingCost: number;
  qualifies: boolean;
  disqualifyReason?: string;
}

/**
 * Models a single hard-money loan against one deal. Rehab draws are assumed to ramp up
 * over the hold period (average drawn rehab balance = 50% of the rehab loan), unless the
 * lender charges interest on the full rehab commitment from day one.
 */
export function calculateHardMoneyLoan(
  purchasePrice: number,
  rehabTotal: number,
  terms: HardMoneyTerms,
  arv: number | undefined,
  holdPeriodMonths: number
): HardMoneyLoanResult {
  const uncappedPurchaseLoan = purchasePrice * terms.purchaseFinancedPct;
  const uncappedRehabLoan = rehabTotal * terms.rehabFinancedPct;
  const uncappedTotal = uncappedPurchaseLoan + uncappedRehabLoan;

  const totalCost = purchasePrice + rehabTotal;
  const ltcCap = terms.ltcCapPct ? maxLoanByLtc(totalCost, terms.ltcCapPct) : Infinity;
  const arvCap = terms.arvLtvCapPct && arv ? maxLoanByLtv(arv, terms.arvLtvCapPct) : Infinity;

  let totalLoan = Math.min(uncappedTotal, ltcCap, arvCap);
  let cappedBy: HardMoneyLoanResult["cappedBy"] = "none";
  if (totalLoan === ltcCap && ltcCap < uncappedTotal) cappedBy = "ltc";
  else if (totalLoan === arvCap && arvCap < uncappedTotal) cappedBy = "arv_ltv";

  let qualifies = true;
  let disqualifyReason: string | undefined;
  if (terms.maxLoan !== undefined && totalLoan > terms.maxLoan) {
    totalLoan = terms.maxLoan;
    cappedBy = "max_loan";
  }
  if (terms.minLoan !== undefined && totalLoan < terms.minLoan) {
    qualifies = false;
    disqualifyReason = `Loan amount $${Math.round(totalLoan).toLocaleString()} is below this lender's $${terms.minLoan.toLocaleString()} minimum.`;
    cappedBy = "min_loan";
  }

  // Split the (possibly capped) total loan back proportionally between purchase/rehab.
  const scale = uncappedTotal > 0 ? totalLoan / uncappedTotal : 0;
  const purchaseLoan = uncappedPurchaseLoan * scale;
  const rehabLoan = uncappedRehabLoan * scale;

  // terms.points is a point COUNT (e.g. 2 means "2 points" = 2% of the loan), not a fraction.
  const pointsCost = totalLoan * (terms.points / 100);
  const feesTotal = (terms.drawFee ?? 0) + (terms.appraisalFee ?? 0) + (terms.underwritingFee ?? 0) + (terms.otherFees ?? 0);

  const downPayment = purchasePrice - purchaseLoan;
  const rehabCashRequired = rehabTotal - rehabLoan;

  const monthlyRate = terms.ratePct / 12;
  const initialMonthlyInterest = purchaseLoan * monthlyRate;
  const fullyDrawnMonthlyInterest = totalLoan * monthlyRate;

  const rehabAverageWeight = terms.rehabInterestOnFullCommitment ? 1 : 0.5;
  const averageBalanceDuringHold = purchaseLoan + rehabLoan * rehabAverageWeight;
  const estimatedInterestDuringHold = averageBalanceDuringHold * terms.ratePct * (holdPeriodMonths / 12);

  const cashToClose = downPayment + pointsCost + feesTotal;
  // Peak cash tied up before any rehab reimbursement/draws land back in the investor's account.
  const maxTemporaryCashExposure = cashToClose + rehabCashRequired + estimatedInterestDuringHold;

  const totalFinancingCost = pointsCost + feesTotal + estimatedInterestDuringHold;

  return {
    purchaseLoan, rehabLoan, totalLoan, cappedBy, pointsCost, feesTotal,
    downPayment, rehabCashRequired, cashToClose, initialMonthlyInterest,
    fullyDrawnMonthlyInterest, estimatedInterestDuringHold, maxTemporaryCashExposure,
    totalFinancingCost, qualifies, disqualifyReason,
  };
}
