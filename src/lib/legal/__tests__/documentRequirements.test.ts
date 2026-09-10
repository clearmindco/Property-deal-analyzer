import { describe, expect, it } from "vitest";
import { getRequiredDocuments } from "@/lib/legal/documentRequirements";
import { evaluateLegalTriggers } from "@/lib/legal/riskGate";
import { emptyLegalIntake } from "@/lib/types/legal";

describe("required document checklist", () => {
  // Scenario 6: subject-to with no distress -> the subject-to-specific document set, no distressed-property docs.
  it("requires subject-to + financing disclosure documents for a clean subject-to deal", () => {
    const intake = { ...emptyLegalIntake(), occupancyType: "TENANT_OCCUPIED" as const };
    const trigger = evaluateLegalTriggers(intake);
    const docs = getRequiredDocuments("SUBJECT_TO", intake, trigger).map((d) => d.key);
    expect(docs).toContain("subject_to_disclosure");
    expect(docs).toContain("due_on_sale_disclosure");
    expect(docs).toContain("existing_financing_addendum");
    expect(docs).toContain("servicing_agreement");
    expect(docs).not.toContain("distressed_property_documents");
  });

  it("routes a gated case to attorney-drafted documents only, regardless of transaction type", () => {
    const intake = { ...emptyLegalIntake(), occupancyType: "OWNER_OCCUPIED" as const, inForeclosure: true };
    const trigger = evaluateLegalTriggers(intake);
    const docs = getRequiredDocuments("SUBJECT_TO", intake, trigger).map((d) => d.key);
    expect(docs).toEqual(["distressed_property_documents", "attorney_review_provision"]);
  });

  it("requires the property condition disclosure for owner-occupied 1-4 family regardless of transaction type", () => {
    const intake = { ...emptyLegalIntake(), occupancyType: "TENANT_OCCUPIED" as const, propertyType: "ONE_TO_FOUR_FAMILY" as const };
    const trigger = evaluateLegalTriggers(intake);
    const docs = getRequiredDocuments("CASH_PURCHASE", intake, trigger).map((d) => d.key);
    expect(docs).toContain("property_condition_disclosure");
  });
});
