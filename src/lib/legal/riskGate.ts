import type { LegalIntake, LegalTriggerResult } from "@/lib/types/legal";

// New York Distressed Property Gate -- shaped after RPL Article 12-B / the Home Equity Theft
// Prevention Act (RPL 265-a), which imposes strict additional requirements ("equity purchase"
// rules) on certain purchases of owner-occupied 1-4 family residential property from a seller
// in specific distress situations.
//
// SAFETY BOUNDARY: this function does not, and must never, restate or paraphrase actual
// statutory text, cite specific subsections as legal conclusions, or claim compliance with
// any statute. It only recognizes the same plain fact pattern the product spec calls out
// (owner-occupied 1-4 family + one or more distress facts) and raises a RED GATE that blocks
// standard contract generation until an attorney is involved. "Unknown" distress facts never
// clear the gate by omission -- see requiresCompleteIntake().

const DISTRESS_FACT_LABELS: { key: keyof LegalIntake; label: string }[] = [
  { key: "inForeclosure", label: "Seller reports the property is currently in foreclosure" },
  { key: "receivedNoticeOfDefault", label: "Seller has received a notice of default" },
  { key: "receivedNoticeOfPendency", label: "Seller has received a notice of pendency (lis pendens)" },
  { key: "taxOrUtilityLienSaleScheduled", label: "A tax or utility lien sale is scheduled on the property" },
  { key: "priorForeclosureReconveyance", label: "Property was previously reconveyed after a foreclosure sale" },
  { key: "sellerToRetainPossessionAfterClosing", label: "Seller would retain possession of the property after closing" },
];

/** True when occupancy/property-type facts are known but at least one distress fact is still
 * `null` (unanswered) -- the case is not clear of the gate, it is simply incomplete. Callers
 * should keep the case in an incomplete-intake state rather than proceeding as if cleared. */
export function requiresCompleteIntake(intake: LegalIntake): boolean {
  if (intake.occupancyType !== "OWNER_OCCUPIED" || intake.propertyType !== "ONE_TO_FOUR_FAMILY") {
    return false;
  }
  return DISTRESS_FACT_LABELS.some(({ key }) => intake[key] === null);
}

export function evaluateLegalTriggers(intake: LegalIntake): LegalTriggerResult {
  const applies = intake.occupancyType === "OWNER_OCCUPIED" && intake.propertyType === "ONE_TO_FOUR_FAMILY";

  if (!applies) {
    return {
      triggered: false,
      triggerType: "NONE",
      triggeringFacts: [],
      gateMessage: null,
      requiredAction: null,
      blocksStandardContractGeneration: false,
    };
  }

  const triggeringFacts = DISTRESS_FACT_LABELS
    .filter(({ key }) => intake[key] === true)
    .map(({ label }) => label);

  if (triggeringFacts.length === 0) {
    return {
      triggered: false,
      triggerType: "NONE",
      triggeringFacts: [],
      gateMessage: null,
      requiredAction: null,
      blocksStandardContractGeneration: false,
    };
  }

  return {
    triggered: true,
    triggerType: "DISTRESSED_PROPERTY_NY_RPL_265A",
    triggeringFacts,
    gateMessage:
      "POTENTIAL DISTRESSED-PROPERTY TRANSACTION -- DO NOT GENERATE A STANDARD CONTRACT. " +
      "This property and seller situation matches a fact pattern New York law treats as an " +
      "\"equity purchase\" from a homeowner in distress, which carries additional mandatory " +
      "requirements. This app does not determine whether those requirements apply or draft " +
      "compliant language -- an attorney licensed in New York must review this transaction " +
      "before any document is presented to the seller.",
    requiredAction: "Route this case to attorney review before generating or presenting any purchase documents.",
    blocksStandardContractGeneration: true,
  };
}
