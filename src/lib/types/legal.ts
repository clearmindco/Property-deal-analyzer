// Types for the Smart Contract Builder / New York Creative Finance Legal Workflow module.
//
// NON-NEGOTIABLE ARCHITECTURE PRINCIPLE (matches the deterministic-engine pattern used by every
// other calc/decision engine in this app): AI EXPLAINS. DATA SUPPORTS. MATH DECIDES.
// HUMAN APPROVES. ATTORNEY-APPROVED LANGUAGE STAYS LOCKED.
//
// - No engine in src/lib/legal/* may invent statutory language, guarantee enforceability, or
//   claim a document is "airtight." Every generated document carries an AttorneyReviewStatus
//   and a visible disclaimer; nothing here is legal advice.
// - The New York distressed-property RED GATE is based only on the specific fact pattern the
//   product spec lists (owner-occupied 1-4 family + default/foreclosure/notice of
//   pendency/tax-or-utility lien sale/reconveyance/seller-retained possession) -- never on an
//   invented threshold, score, or heuristic.
// - Editing template clause content must never silently carry forward an attorney's prior
//   approval to the new content -- see templateVersioning.ts.
// - An executed (signed) GeneratedDocument is immutable -- see documentImmutability.ts.

export type LegalTransactionType =
  | "CASH_PURCHASE"
  | "SELLER_FINANCE"
  | "SUBJECT_TO"
  | "HYBRID"
  | "LEASE_OPTION"
  | "WHOLESALE"
  | "OTHER";

export const LEGAL_TRANSACTION_TYPE_LABELS: Record<LegalTransactionType, string> = {
  CASH_PURCHASE: "Cash Purchase",
  SELLER_FINANCE: "Seller Finance",
  SUBJECT_TO: "Subject-To Existing Financing",
  HYBRID: "Hybrid (existing debt + seller equity financing)",
  LEASE_OPTION: "Lease Option",
  WHOLESALE: "Wholesale / Assignment",
  OTHER: "Other",
};

export type AttorneyReviewStatus =
  | "DRAFT_NOT_REVIEWED"
  | "UNDER_ATTORNEY_REVIEW"
  | "ATTORNEY_APPROVED"
  | "ATTORNEY_APPROVED_WITH_RESTRICTIONS"
  | "REJECTED_BY_ATTORNEY"
  | "NEEDS_REVIEW_UPDATE";

export const ATTORNEY_REVIEW_STATUS_LABELS: Record<AttorneyReviewStatus, string> = {
  DRAFT_NOT_REVIEWED: "Draft -- not attorney reviewed",
  UNDER_ATTORNEY_REVIEW: "Under attorney review",
  ATTORNEY_APPROVED: "Attorney approved",
  ATTORNEY_APPROVED_WITH_RESTRICTIONS: "Attorney approved with restrictions",
  REJECTED_BY_ATTORNEY: "Rejected by attorney",
  NEEDS_REVIEW_UPDATE: "Needs re-review (content changed since last approval)",
};

export type LegalRuleStatus = "DRAFT" | "VERIFIED" | "NEEDS_REVIEW" | "DEPRECATED";

export type OccupancyType = "OWNER_OCCUPIED" | "TENANT_OCCUPIED" | "VACANT" | "UNKNOWN";

export type LegalPropertyType =
  | "ONE_TO_FOUR_FAMILY"
  | "MULTIFAMILY_5_PLUS"
  | "CONDO"
  | "COMMERCIAL"
  | "LAND"
  | "OTHER";

export type FinancingFactSource = "VERIFIED" | "SELLER_REPORTED" | "UNKNOWN";

/** Pre-Contract Legal Screen -- captured once per deal, before any document is generated.
 * Every distress-related field is a tri-state (true/false/null) because "unknown" must never
 * be silently treated as "false" -- an unanswered distress question keeps the case in an
 * incomplete-intake state rather than clearing the gate by omission. */
export interface LegalIntake {
  occupancyType: OccupancyType;
  propertyType: LegalPropertyType;

  // NY RPL Article 12-B / "Home Equity Theft Prevention Act" (RPL 265-a)-shaped trigger facts.
  inForeclosure: boolean | null;
  receivedNoticeOfDefault: boolean | null;
  receivedNoticeOfPendency: boolean | null;
  taxOrUtilityLienSaleScheduled: boolean | null;
  priorForeclosureReconveyance: boolean | null;
  sellerToRetainPossessionAfterClosing: boolean | null;

  // Financing facts -- verified vs. seller-reported precedence (see financingVerification.ts).
  mortgageStatementReceived: boolean;
  sellerReportedMonthlyPayment: number | null;
  verifiedMonthlyPayment: number | null;
  sellerReportedLoanBalance: number | null;
  verifiedLoanBalance: number | null;

  notes: string | null;
}

export function emptyLegalIntake(): LegalIntake {
  return {
    occupancyType: "UNKNOWN",
    propertyType: "ONE_TO_FOUR_FAMILY",
    inForeclosure: null,
    receivedNoticeOfDefault: null,
    receivedNoticeOfPendency: null,
    taxOrUtilityLienSaleScheduled: null,
    priorForeclosureReconveyance: null,
    sellerToRetainPossessionAfterClosing: null,
    mortgageStatementReceived: false,
    sellerReportedMonthlyPayment: null,
    verifiedMonthlyPayment: null,
    sellerReportedLoanBalance: null,
    verifiedLoanBalance: null,
    notes: null,
  };
}

export type LegalTriggerType = "NONE" | "DISTRESSED_PROPERTY_NY_RPL_265A";

export interface LegalTriggerResult {
  triggered: boolean;
  triggerType: LegalTriggerType;
  /** The specific facts that caused the gate to fire -- preserved verbatim, never summarized
   * away, so the record of *why* a case was gated survives even if the seller's situation
   * later changes. */
  triggeringFacts: string[];
  gateMessage: string | null;
  requiredAction: string | null;
  blocksStandardContractGeneration: boolean;
}

export type DocumentKey =
  | "purchase_agreement"
  | "existing_financing_addendum"
  | "subject_to_disclosure"
  | "seller_acknowledgment"
  | "due_on_sale_disclosure"
  | "servicing_agreement"
  | "payment_authorization"
  | "insurance_requirements"
  | "attorney_review_provision"
  | "title_closing_instructions"
  | "property_condition_disclosure"
  | "jurisdiction_specific"
  | "distressed_property_documents"
  | "seller_finance_note"
  | "seller_finance_security_instrument"
  | "hybrid_seller_carry_addendum"
  | "other_attorney_addenda";

export const DOCUMENT_KEY_LABELS: Record<DocumentKey, string> = {
  purchase_agreement: "Purchase agreement",
  existing_financing_addendum: "Existing financing addendum",
  subject_to_disclosure: "Subject-to disclosure",
  seller_acknowledgment: "Seller acknowledgment",
  due_on_sale_disclosure: "Due-on-sale risk disclosure",
  servicing_agreement: "Loan servicing agreement",
  payment_authorization: "Payment authorization",
  insurance_requirements: "Insurance requirements",
  attorney_review_provision: "Attorney review provision",
  title_closing_instructions: "Title / closing instructions",
  property_condition_disclosure: "Property condition disclosure",
  jurisdiction_specific: "Jurisdiction-specific addendum",
  distressed_property_documents: "NY distressed-property required documents",
  seller_finance_note: "Seller finance promissory note",
  seller_finance_security_instrument: "Seller finance security instrument (mortgage/deed of trust)",
  hybrid_seller_carry_addendum: "Hybrid seller-carry addendum",
  other_attorney_addenda: "Other attorney-drafted addenda",
};

export interface DocumentRequirement {
  key: DocumentKey;
  label: string;
  required: boolean;
  reason: string;
  attorneyReviewRequired: boolean;
}

export interface FinancingFact {
  value: number | null;
  source: FinancingFactSource;
  sellerReportedValue: number | null;
}

export interface EffectiveFinancingFacts {
  monthlyPayment: FinancingFact;
  loanBalance: FinancingFact;
}

export interface AttorneySummary {
  headline: string;
  transactionType: LegalTransactionType;
  transactionTypeLabel: string;
  propertyFacts: string[];
  triggerFlags: string[];
  financingSummary: string[];
  requiredDocuments: { label: string; reason: string }[];
  openQuestions: string[];
  disclaimer: string;
}

export type LegalCaseStatus =
  | "DRAFT"
  | "INTAKE_COMPLETE"
  | "RED_GATE_HOLD"
  | "DOCUMENTS_GENERATED"
  | "UNDER_ATTORNEY_REVIEW"
  | "READY_TO_SIGN"
  | "EXECUTED"
  | "SERVICING"
  | "CLOSED";

export type GeneratedDocumentStatus = "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "EXECUTED" | "VOID";
