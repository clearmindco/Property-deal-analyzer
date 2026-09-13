import { describe, expect, it } from "vitest";
import { determineAvailableStrategies } from "@/lib/strategy/strategyAvailability";
import type { ContractControlFacts } from "@/lib/types/strategy";

function facts(overrides: Partial<ContractControlFacts> = {}): ContractControlFacts {
  return { sourceType: null, assignmentPermitted: null, sellerApprovalForTerms: null, wholesalerControlsContract: null, ...overrides };
}

function availabilityOf(strategy: string, results: ReturnType<typeof determineAvailableStrategies>) {
  return results.find((r) => r.strategy === strategy)!;
}

describe("strategy availability -- core rule: lead source is not deal structure", () => {
  it("always makes cash, BRRRR, and DSCR rental available regardless of source", () => {
    const results = determineAvailableStrategies(facts({ sourceType: "WHOLESALER" }));
    expect(availabilityOf("CASH_PURCHASE", results).available).toBe(true);
    expect(availabilityOf("BRRRR", results).available).toBe(true);
    expect(availabilityOf("DSCR_RENTAL", results).available).toBe(true);
  });

  it("a wholesaler cannot offer seller financing, subject-to, hybrid, wrap, or lease option merely by having a contract", () => {
    const results = determineAvailableStrategies(facts({ sourceType: "WHOLESALER" }));
    for (const strategy of ["SELLER_FINANCE", "SUBJECT_TO", "HYBRID", "WRAP", "LEASE_OPTION"]) {
      const result = availabilityOf(strategy, results);
      expect(result.available).toBe(false);
      expect(result.reason).toMatch(/control|approved/i);
    }
  });

  it("makes seller-cooperation strategies available once the wholesaler controls the contract AND the seller approved terms", () => {
    const results = determineAvailableStrategies(facts({
      sourceType: "WHOLESALER", wholesalerControlsContract: "YES", sellerApprovalForTerms: "YES",
    }));
    expect(availabilityOf("SELLER_FINANCE", results).available).toBe(true);
    expect(availabilityOf("SUBJECT_TO", results).available).toBe(true);
  });

  it("does not grant seller cooperation from contract control alone, without seller approval", () => {
    const results = determineAvailableStrategies(facts({
      sourceType: "WHOLESALER", wholesalerControlsContract: "YES", sellerApprovalForTerms: null,
    }));
    expect(availabilityOf("SELLER_FINANCE", results).available).toBe(false);
    expect(availabilityOf("SELLER_FINANCE", results).reason).toMatch(/seller has not approved/i);
  });

  it("makes seller-cooperation strategies available by default for a direct seller or realtor source", () => {
    const direct = determineAvailableStrategies(facts({ sourceType: "DIRECT_SELLER" }));
    const realtor = determineAvailableStrategies(facts({ sourceType: "REALTOR" }));
    expect(availabilityOf("SELLER_FINANCE", direct).available).toBe(true);
    expect(availabilityOf("SUBJECT_TO", realtor).available).toBe(true);
  });

  it("never treats an unconfirmed referral/investor source as approved seller cooperation", () => {
    const results = determineAvailableStrategies(facts({ sourceType: "REFERRAL" }));
    expect(availabilityOf("SELLER_FINANCE", results).available).toBe(false);
  });

  it("restricts assignment to contracts that confirm it's permitted", () => {
    const blocked = determineAvailableStrategies(facts({ assignmentPermitted: false }));
    expect(availabilityOf("WHOLESALE_ASSIGNMENT", blocked).available).toBe(false);

    const allowed = determineAvailableStrategies(facts({ assignmentPermitted: true }));
    expect(availabilityOf("WHOLESALE_ASSIGNMENT", allowed).available).toBe(true);
  });

  it("always allows a double close regardless of assignment permission", () => {
    const results = determineAvailableStrategies(facts({ assignmentPermitted: false }));
    expect(availabilityOf("DOUBLE_CLOSE", results).available).toBe(true);
  });

  it("only allows renegotiating a wholesale contract when the deal actually came from one", () => {
    const fromWholesaler = determineAvailableStrategies(facts({ sourceType: "WHOLESALER" }));
    const fromDirectSeller = determineAvailableStrategies(facts({ sourceType: "DIRECT_SELLER" }));
    expect(availabilityOf("RENEGOTIATED_WHOLESALE", fromWholesaler).available).toBe(true);
    expect(availabilityOf("RENEGOTIATED_WHOLESALE", fromDirectSeller).available).toBe(false);
  });
});
