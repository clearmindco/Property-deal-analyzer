import type {
  HybridTerms, OperatingExpenseAssumptions, SellerFinanceTerms, SubjectToTerms,
} from "@/lib/types/deal";
import { monthlyPI } from "./mortgage";
import { calculateCashFlow, type CashFlowResult } from "./cashFlow";

// Deterministic subject-to / seller-finance / hybrid modeling. Same non-negotiable as every
// other calc engine in this app: this produces numbers only. It never tells the user whether a
// structure is "safe," never estimates the probability a lender calls a loan due, and never
// substitutes for the Smart Contract Builder's legal risk gate or an attorney's review.

export interface CreativeFinanceScenarioResult {
  label: string;
  applicable: boolean;
  /** Why the scenario can't be modeled yet, when applicable is false. */
  blockedReason?: string;
  monthlyDebtService: number;
  cashFlow: CashFlowResult | null;
  cashToClose: number;
  /** null when cashToClose is ~0 -- a percentage return on zero cash isn't a meaningful number. */
  cashOnCashReturn: number | null;
  equityCaptured: number | null;
  riskFlags: string[];
  assumptionNotes: string[];
}

const DUE_ON_SALE_RISK =
  "Due-on-sale risk: most mortgages let the lender demand full repayment if the property transfers without payoff. " +
  "This app does not eliminate that risk, does not estimate its likelihood, and does not guarantee any outcome.";

function naFn(label: string, reason: string): CreativeFinanceScenarioResult {
  return {
    label, applicable: false, blockedReason: reason, monthlyDebtService: 0, cashFlow: null,
    cashToClose: 0, cashOnCashReturn: null, equityCaptured: null, riskFlags: [], assumptionNotes: [],
  };
}

function cashOnCash(cashFlow: CashFlowResult, cashToClose: number): number | null {
  if (cashToClose <= 1) return null;
  return cashFlow.netAnnualCashFlow / cashToClose;
}

export function analyzeSubjectTo(
  terms: SubjectToTerms | undefined,
  arv: number,
  rentMonthly: number,
  expenses: OperatingExpenseAssumptions
): CreativeFinanceScenarioResult {
  const label = "Subject-To";
  if (!terms || (!terms.existingLoan.balance && !terms.existingLoan.monthlyPayment)) {
    return naFn(label, "Enter the existing loan balance and monthly payment to model this scenario.");
  }

  const balance = terms.existingLoan.balance ?? 0;
  const assumptionNotes: string[] = [];
  let monthlyPayment = terms.existingLoan.monthlyPayment;
  if (!monthlyPayment) {
    monthlyPayment = monthlyPI(balance, terms.existingLoan.interestRatePct ?? 0.06, 30);
    assumptionNotes.push("Monthly payment estimated from balance and rate assuming a 30-year term -- enter the actual payment for an exact number.");
  }

  const cashFlow = calculateCashFlow(rentMonthly, monthlyPayment, expenses);
  const cashToClose = (terms.cashToSeller ?? 0) + (terms.arrearsToCoverAtClosing ?? 0) + (terms.closingCosts ?? 0);
  const equityCaptured = arv > 0 ? arv - balance - cashToClose : null;

  const riskFlags = [DUE_ON_SALE_RISK];
  if (terms.existingLoan.escrowedForTaxesInsurance === false) {
    riskFlags.push("Loan is not escrowed -- you are responsible for tracking and paying taxes and insurance directly to avoid default.");
  }

  return {
    label, applicable: true, monthlyDebtService: monthlyPayment, cashFlow, cashToClose,
    cashOnCashReturn: cashOnCash(cashFlow, cashToClose), equityCaptured, riskFlags, assumptionNotes,
  };
}

export function analyzeSellerFinance(
  terms: SellerFinanceTerms | undefined,
  arv: number,
  rentMonthly: number,
  expenses: OperatingExpenseAssumptions
): CreativeFinanceScenarioResult {
  const label = "Seller Finance";
  if (!terms || !terms.purchasePrice || terms.noteRatePct === undefined || !terms.noteTermYears) {
    return naFn(label, "Enter purchase price, down payment, note rate, and note term to model this scenario.");
  }

  const downPayment = terms.downPayment ?? 0;
  const notePrincipal = Math.max(0, terms.purchasePrice - downPayment);
  const monthlyPayment = monthlyPI(notePrincipal, terms.noteRatePct, terms.noteTermYears);
  const cashFlow = calculateCashFlow(rentMonthly, monthlyPayment, expenses);
  const cashToClose = downPayment + (terms.closingCosts ?? 0);
  const equityCaptured = arv > 0 ? arv - terms.purchasePrice : null;

  const riskFlags: string[] = [
    "Missing a payment on a seller-financed note can lead to default and loss of the property, the same as any other mortgage.",
  ];
  if (terms.balloonMonths && terms.balloonMonths > 0) {
    riskFlags.push(
      `Balloon payment due in ${terms.balloonMonths} months -- you must refinance or sell before then. This app does not guarantee refinance approval or a sale at any particular price.`
    );
  }

  return {
    label, applicable: true, monthlyDebtService: monthlyPayment, cashFlow, cashToClose,
    cashOnCashReturn: cashOnCash(cashFlow, cashToClose), equityCaptured, riskFlags, assumptionNotes: [],
  };
}

export function analyzeHybrid(
  terms: HybridTerms | undefined,
  arv: number,
  rentMonthly: number,
  expenses: OperatingExpenseAssumptions
): CreativeFinanceScenarioResult {
  const label = "Hybrid";
  if (!terms || (!terms.existingLoan.balance && !terms.existingLoan.monthlyPayment) || !terms.sellerCarryAmount) {
    return naFn(label, "Enter the existing loan facts and the seller-carry amount/rate/term to model this scenario.");
  }

  const balance = terms.existingLoan.balance ?? 0;
  const assumptionNotes: string[] = [];
  let existingPayment = terms.existingLoan.monthlyPayment;
  if (!existingPayment) {
    existingPayment = monthlyPI(balance, terms.existingLoan.interestRatePct ?? 0.06, 30);
    assumptionNotes.push("Existing loan payment estimated from balance and rate assuming a 30-year term -- enter the actual payment for an exact number.");
  }
  const carryPayment = monthlyPI(terms.sellerCarryAmount, terms.sellerCarryRatePct ?? 0.06, terms.sellerCarryTermYears ?? 10);
  const monthlyDebtService = existingPayment + carryPayment;

  const cashFlow = calculateCashFlow(rentMonthly, monthlyDebtService, expenses);
  const cashToClose = (terms.cashToSeller ?? 0) + (terms.closingCosts ?? 0);
  const equityCaptured = arv > 0 ? arv - balance - terms.sellerCarryAmount - cashToClose : null;

  const riskFlags = [
    DUE_ON_SALE_RISK,
    "The seller-carry note carries the same default risk as any seller-financed note -- missing a payment can put the property at risk.",
  ];

  return {
    label, applicable: true, monthlyDebtService, cashFlow, cashToClose,
    cashOnCashReturn: cashOnCash(cashFlow, cashToClose), equityCaptured, riskFlags, assumptionNotes,
  };
}

export interface ExitStrategyRecommendation {
  recommendedLabel: string | null;
  reasoning: string[];
}

/**
 * Deterministic, transparent-reasons comparison across scenarios (spec: "exit-strategy
 * engine"). Never a hidden score -- picks the cash-flow-positive scenario needing the least
 * cash to close, and says so; recommends nothing when no modeled scenario cash flows.
 */
export function recommendExitStrategy(scenarios: CreativeFinanceScenarioResult[]): ExitStrategyRecommendation {
  const viable = scenarios.filter((s) => s.applicable && s.cashFlow && s.cashFlow.netMonthlyCashFlow > 0);
  if (viable.length === 0) {
    return {
      recommendedLabel: null,
      reasoning: ["None of the modeled structures produce positive monthly cash flow at these terms -- revisit price, terms, or pass on this deal."],
    };
  }
  const best = [...viable].sort((a, b) => a.cashToClose - b.cashToClose)[0]!;
  return {
    recommendedLabel: best.label,
    reasoning: [
      `${best.label} produces positive cash flow (${Math.round(best.cashFlow!.netMonthlyCashFlow).toLocaleString()}/mo) for the least cash to close ($${Math.round(best.cashToClose).toLocaleString()}) among the scenarios you've entered.`,
      "This compares only the scenarios you've filled in -- it is not a recommendation on legal structure, and it does not override the Legal tab's risk gate.",
    ],
  };
}
