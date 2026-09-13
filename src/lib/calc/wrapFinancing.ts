import type { OperatingExpenseAssumptions } from "@/lib/types/deal";
import { monthlyPI } from "./mortgage";
import { calculateCashFlow, type CashFlowResult } from "./cashFlow";

// Strategy 7: Wrap / Wraparound Financing -- distinct from Hybrid (src/lib/calc/
// creativeFinance.ts): in a wrap, the buyer pays ONE blended note to the seller, and the
// seller continues paying the underlying loan out of what they collect. The buyer never pays
// the underlying lender directly. In Hybrid, the buyer pays the existing loan and a separate
// seller-carry note side by side. Both keep the existing loan in place -- both carry
// due-on-sale exposure -- but the payment structure and reliance risk are different, so a wrap
// is never modeled as "just another Hybrid."

export interface WrapTerms {
  purchasePrice: number;
  downPayment: number;
  wrapRatePct: number; // decimal -- the rate on the new blended wrap note
  wrapTermYears: number;
  existingLoanBalance?: number;
  existingLoanPayment?: number;
  closingCosts?: number;
}

export interface WrapResult {
  wrapPrincipal: number;
  monthlyWrapPayment: number;
  sellerSpreadMonthly: number | null;
  cashFlow: CashFlowResult;
  cashRequired: number;
  riskFlags: string[];
}

const RELIANCE_RISK =
  "Wrap reliance risk: you pay the seller, and the seller is relying on them to keep paying the underlying " +
  "lender. If the seller stops paying it, the underlying lender can foreclose even though you are current on " +
  "the wrap note. This app cannot verify the seller's ongoing payment behavior.";

const DUE_ON_SALE_RISK =
  "Due-on-sale risk: the underlying loan stays in the seller's name and on the property. Most mortgages let " +
  "the lender demand full repayment when title transfers. This app does not eliminate or estimate that risk.";

export function analyzeWrap(
  terms: WrapTerms,
  rentMonthly: number,
  expenses: OperatingExpenseAssumptions
): WrapResult {
  const wrapPrincipal = Math.max(0, terms.purchasePrice - terms.downPayment);
  const monthlyWrapPayment = monthlyPI(wrapPrincipal, terms.wrapRatePct, terms.wrapTermYears);
  const cashFlow = calculateCashFlow(rentMonthly, monthlyWrapPayment, expenses);
  const sellerSpreadMonthly = terms.existingLoanPayment !== undefined
    ? monthlyWrapPayment - terms.existingLoanPayment
    : null;

  return {
    wrapPrincipal,
    monthlyWrapPayment,
    sellerSpreadMonthly,
    cashFlow,
    cashRequired: terms.downPayment + (terms.closingCosts ?? 0),
    riskFlags: [DUE_ON_SALE_RISK, RELIANCE_RISK],
  };
}
