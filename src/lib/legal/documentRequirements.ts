import type {
  DocumentKey,
  DocumentRequirement,
  LegalIntake,
  LegalTransactionType,
  LegalTriggerResult,
} from "@/lib/types/legal";
import { DOCUMENT_KEY_LABELS } from "@/lib/types/legal";

function req(key: DocumentKey, reason: string, attorneyReviewRequired = true): DocumentRequirement {
  return { key, label: DOCUMENT_KEY_LABELS[key], required: true, reason, attorneyReviewRequired };
}

export function isPropertyConditionDisclosureApplicable(intake: LegalIntake): boolean {
  // NY property condition disclosure rules turn on residential occupancy, not on transaction
  // structure -- applies across cash, seller-finance, subject-to, and hybrid alike.
  return intake.propertyType === "ONE_TO_FOUR_FAMILY" || intake.propertyType === "CONDO";
}

/** Never called when the red gate is active -- callers must check `triggerResult.blocksStandardContractGeneration`
 * first and route to attorney review instead of calling this. */
export function getRequiredDocuments(
  transactionType: LegalTransactionType,
  intake: LegalIntake,
  triggerResult: LegalTriggerResult
): DocumentRequirement[] {
  if (triggerResult.blocksStandardContractGeneration) {
    return [
      req(
        "distressed_property_documents",
        "This case matches a New York distressed-property fact pattern -- attorney-drafted documents are required; no standard template applies.",
      ),
      req("attorney_review_provision", "Every document in a gated case must be attorney-drafted or attorney-reviewed before use."),
    ];
  }

  const docs: DocumentRequirement[] = [
    req("purchase_agreement", "Base agreement for every transaction type."),
    req("attorney_review_provision", "Every generated document must carry an attorney-review clause and status."),
    req("title_closing_instructions", "Title and closing handling apply regardless of financing structure."),
  ];

  if (isPropertyConditionDisclosureApplicable(intake)) {
    docs.push(req("property_condition_disclosure", "Required for owner-occupied 1-4 family / condo residential property."));
  }

  if (transactionType === "SUBJECT_TO" || transactionType === "HYBRID") {
    docs.push(req("existing_financing_addendum", "Existing mortgage stays in place and must be disclosed and addressed."));
    docs.push(req("subject_to_disclosure", "Seller must be clearly told the loan stays in their name."));
    docs.push(req("due_on_sale_disclosure", "Due-on-sale risk must be disclosed in writing -- never described as riskless."));
    docs.push(req("servicing_agreement", "Ongoing loan servicing/payment handling must be documented."));
    docs.push(req("payment_authorization", "Authorization for the buyer to make payments on the seller's existing loan."));
    docs.push(req("insurance_requirements", "Insurance coverage on a subject-to property needs explicit handling."));
  }

  if (transactionType === "SELLER_FINANCE" || transactionType === "HYBRID") {
    docs.push(req("seller_finance_note", "Promissory note memorializing the seller-financed balance."));
    docs.push(req("seller_finance_security_instrument", "Security instrument (mortgage/deed of trust) securing the note."));
  }

  if (transactionType === "HYBRID") {
    docs.push(req("hybrid_seller_carry_addendum", "Addendum reconciling existing debt with seller equity financing."));
  }

  docs.push(req("jurisdiction_specific", "Placeholder for county/municipality-specific requirements once loaded for this market.", false));

  return docs;
}
