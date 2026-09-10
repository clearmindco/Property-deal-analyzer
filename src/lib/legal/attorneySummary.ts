import type {
  AttorneySummary,
  DocumentRequirement,
  EffectiveFinancingFacts,
  LegalIntake,
  LegalTransactionType,
  LegalTriggerResult,
} from "@/lib/types/legal";
import { LEGAL_TRANSACTION_TYPE_LABELS } from "@/lib/types/legal";

const DISCLAIMER =
  "This summary is generated from the facts entered in this app and is not legal advice. " +
  "It does not determine compliance with any law, does not guarantee any document is " +
  "enforceable, and does not substitute for review by an attorney licensed in the property's " +
  "jurisdiction.";

function money(n: number | null): string {
  if (n === null) return "not known";
  return `$${n.toLocaleString()}`;
}

export function buildAttorneySummary(
  intake: LegalIntake,
  transactionType: LegalTransactionType,
  triggerResult: LegalTriggerResult,
  requiredDocuments: DocumentRequirement[],
  financingFacts: EffectiveFinancingFacts
): AttorneySummary {
  const propertyFacts = [
    `Occupancy: ${intake.occupancyType.replace(/_/g, " ").toLowerCase()}`,
    `Property type: ${intake.propertyType.replace(/_/g, " ").toLowerCase()}`,
    `Mortgage statement received: ${intake.mortgageStatementReceived ? "yes" : "no"}`,
  ];

  const triggerFlags = triggerResult.triggered
    ? [`RED GATE -- ${triggerResult.triggerType}`, ...triggerResult.triggeringFacts]
    : ["No distressed-property trigger facts identified from current intake."];

  const financingSummary = [
    `Monthly payment: ${money(financingFacts.monthlyPayment.value)} (${financingFacts.monthlyPayment.source.toLowerCase().replace("_", " ")})`,
    `Loan balance: ${money(financingFacts.loanBalance.value)} (${financingFacts.loanBalance.source.toLowerCase().replace("_", " ")})`,
  ];
  if (financingFacts.monthlyPayment.source === "SELLER_REPORTED" && financingFacts.monthlyPayment.sellerReportedValue !== null) {
    financingSummary.push("Monthly payment is seller-reported only -- not yet independently verified.");
  }
  if (financingFacts.loanBalance.source === "SELLER_REPORTED" && financingFacts.loanBalance.sellerReportedValue !== null) {
    financingSummary.push("Loan balance is seller-reported only -- not yet independently verified.");
  }

  const openQuestions: string[] = [];
  if (!intake.mortgageStatementReceived && (transactionType === "SUBJECT_TO" || transactionType === "HYBRID")) {
    openQuestions.push("Mortgage statement has not been received -- financing terms are unverified.");
  }
  if (financingFacts.monthlyPayment.source === "UNKNOWN") openQuestions.push("Monthly payment is unknown.");
  if (financingFacts.loanBalance.source === "UNKNOWN") openQuestions.push("Loan balance is unknown.");

  return {
    headline: triggerResult.triggered
      ? "POTENTIAL DISTRESSED-PROPERTY TRANSACTION -- ATTORNEY REVIEW REQUIRED BEFORE ANY CONTRACT"
      : `${LEGAL_TRANSACTION_TYPE_LABELS[transactionType]} -- attorney intake summary`,
    transactionType,
    transactionTypeLabel: LEGAL_TRANSACTION_TYPE_LABELS[transactionType],
    propertyFacts,
    triggerFlags,
    financingSummary,
    requiredDocuments: requiredDocuments.map((d) => ({ label: d.label, reason: d.reason })),
    openQuestions,
    disclaimer: DISCLAIMER,
  };
}
