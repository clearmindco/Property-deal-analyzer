import type { AttorneyReviewStatus, LegalIntake, LegalTransactionType } from "@/lib/types/legal";
import { ATTORNEY_REVIEW_STATUS_LABELS } from "@/lib/types/legal";
import { effectiveFinancingFacts } from "./financingVerification";

const NOT_PROVIDED = "[NOT YET PROVIDED]";

function fmt(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return NOT_PROVIDED;
  return typeof value === "number" ? value.toLocaleString() : value;
}

export interface DocumentFieldsSnapshotInput {
  dealAddress: string;
  askingPrice: number | null;
  transactionType: LegalTransactionType;
  intake: LegalIntake;
  sellerName?: string | null;
}

/** Pulls only facts already captured elsewhere in the app (deal + legal intake) into a flat
 * key/value snapshot -- never invents a value, never guesses at a blank field. */
export function buildDocumentFieldsSnapshot(input: DocumentFieldsSnapshotInput): Record<string, string> {
  const financing = effectiveFinancingFacts(input.intake);
  return {
    "Property address": fmt(input.dealAddress),
    "Seller name": fmt(input.sellerName),
    "Asking price": input.askingPrice ? `$${fmt(input.askingPrice)}` : NOT_PROVIDED,
    "Transaction type": input.transactionType.replace(/_/g, " "),
    Occupancy: input.intake.occupancyType.replace(/_/g, " ").toLowerCase(),
    "Property type": input.intake.propertyType.replace(/_/g, " ").toLowerCase(),
    "Existing loan balance": financing.loanBalance.value !== null
      ? `$${fmt(financing.loanBalance.value)} (${financing.loanBalance.source.toLowerCase().replace("_", " ")})`
      : NOT_PROVIDED,
    "Existing monthly payment": financing.monthlyPayment.value !== null
      ? `$${fmt(financing.monthlyPayment.value)} (${financing.monthlyPayment.source.toLowerCase().replace("_", " ")})`
      : NOT_PROVIDED,
    "Mortgage statement received": input.intake.mortgageStatementReceived ? "Yes" : "No",
  };
}

function renderFieldsBlock(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([label, value]) => `  - ${label}: ${value}`)
    .join("\n");
}

/** Token substitution over a template body -- {{FIELDS_BLOCK}} and {{ATTORNEY_REVIEW_STATUS}}
 * are the only tokens any registry template uses; anything else is rendered as an explicit
 * [MISSING: x] marker rather than silently left blank or guessed at. */
export function assembleDocumentBody(
  bodyTemplate: string,
  fields: Record<string, string>,
  attorneyReviewStatus: AttorneyReviewStatus
): string {
  const tokens: Record<string, string> = {
    FIELDS_BLOCK: renderFieldsBlock(fields),
    ATTORNEY_REVIEW_STATUS: ATTORNEY_REVIEW_STATUS_LABELS[attorneyReviewStatus],
  };
  return bodyTemplate.replace(/\{\{(\w+)\}\}/g, (_match, token: string) =>
    token in tokens ? tokens[token]! : `[MISSING: ${token}]`
  );
}
