import { describe, expect, it } from "vitest";
import { evaluateLegalTriggers, requiresCompleteIntake } from "@/lib/legal/riskGate";
import { emptyLegalIntake } from "@/lib/types/legal";

describe("legal risk gate (NY distressed-property fact pattern)", () => {
  // Scenario 1: owner-occupied 1-4 family + notice of default -> RED GATE, blocks standard contract.
  it("triggers on owner-occupied 1-4 family with a notice of default", () => {
    const intake = { ...emptyLegalIntake(), occupancyType: "OWNER_OCCUPIED" as const, receivedNoticeOfDefault: true };
    const result = evaluateLegalTriggers(intake);
    expect(result.triggered).toBe(true);
    expect(result.triggerType).toBe("DISTRESSED_PROPERTY_NY_RPL_265A");
    expect(result.blocksStandardContractGeneration).toBe(true);
    expect(result.triggeringFacts.join(" ")).toMatch(/notice of default/i);
  });

  // Scenario 2: owner-occupied 1-4 family, no distress facts -> no gate.
  it("does not trigger when no distress facts are present", () => {
    const intake = {
      ...emptyLegalIntake(),
      occupancyType: "OWNER_OCCUPIED" as const,
      inForeclosure: false,
      receivedNoticeOfDefault: false,
      receivedNoticeOfPendency: false,
      taxOrUtilityLienSaleScheduled: false,
      priorForeclosureReconveyance: false,
      sellerToRetainPossessionAfterClosing: false,
    };
    const result = evaluateLegalTriggers(intake);
    expect(result.triggered).toBe(false);
    expect(result.blocksStandardContractGeneration).toBe(false);
  });

  // Scenario 3: tenant-occupied property with a foreclosure notice -> gate does not apply (occupancy requirement not met).
  it("does not trigger for tenant-occupied property even with distress facts", () => {
    const intake = { ...emptyLegalIntake(), occupancyType: "TENANT_OCCUPIED" as const, inForeclosure: true };
    const result = evaluateLegalTriggers(intake);
    expect(result.triggered).toBe(false);
  });

  // Scenario 4: 5+ unit multifamily with distress facts -> gate does not apply (property type not covered).
  it("does not trigger for multifamily 5+ property even with distress facts", () => {
    const intake = {
      ...emptyLegalIntake(),
      occupancyType: "OWNER_OCCUPIED" as const,
      propertyType: "MULTIFAMILY_5_PLUS" as const,
      receivedNoticeOfPendency: true,
    };
    const result = evaluateLegalTriggers(intake);
    expect(result.triggered).toBe(false);
  });

  // Scenario 5: seller-retained possession after closing alone triggers the gate.
  it("triggers on seller-retained possession alone, with no other distress fact", () => {
    const intake = { ...emptyLegalIntake(), occupancyType: "OWNER_OCCUPIED" as const, sellerToRetainPossessionAfterClosing: true };
    const result = evaluateLegalTriggers(intake);
    expect(result.triggered).toBe(true);
    expect(result.triggeringFacts.join(" ")).toMatch(/retain possession/i);
  });

  it("flags incomplete intake rather than clearing the gate when a distress fact is unanswered", () => {
    const intake = { ...emptyLegalIntake(), occupancyType: "OWNER_OCCUPIED" as const };
    expect(requiresCompleteIntake(intake)).toBe(true);
    expect(evaluateLegalTriggers(intake).triggered).toBe(false);
  });

  it("never states a statutory conclusion or promises compliance in the gate message", () => {
    const intake = { ...emptyLegalIntake(), occupancyType: "OWNER_OCCUPIED" as const, inForeclosure: true };
    const result = evaluateLegalTriggers(intake);
    expect(result.gateMessage ?? "").not.toMatch(/complies with|is compliant|guarantees|airtight/i);
  });
});
