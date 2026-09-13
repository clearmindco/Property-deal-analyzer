import type { ContractControlFacts, StrategyAvailability, StrategyId } from "@/lib/types/strategy";
import { ALL_STRATEGIES, SELLER_COOPERATION_STRATEGIES, STRATEGY_LABELS } from "@/lib/types/strategy";

// Master Deal Structuring Engine -- authority gate. This is the single most emphasized rule in
// the spec: a lead source and a deal structure are two different things, and a wholesaler's
// assignment NEVER grants authority to offer seller financing, subject-to, a wrap, or a lease
// option just because they have a property under contract. Before any strategy's numbers are
// ever run, this function decides whether the structure is even legitimately on the table.

function sellerCooperationAvailability(facts: ContractControlFacts): { available: boolean; reason: string } {
  if (facts.sourceType === "DIRECT_SELLER" || facts.sourceType === "REALTOR") {
    return {
      available: true,
      reason: "Direct access to the seller (or their listing agent) -- creative terms can be negotiated directly.",
    };
  }

  if (facts.sourceType === "WHOLESALER") {
    if (facts.wholesalerControlsContract !== "YES") {
      return {
        available: false,
        reason: "The wholesaler's control over a valid, assignable contract has not been confirmed. A wholesaler cannot offer seller financing, subject-to, a wrap, or a lease option merely because they have the property under contract.",
      };
    }
    if (facts.sellerApprovalForTerms !== "YES") {
      return {
        available: false,
        reason: "The wholesaler controls the contract, but the underlying seller has not approved a restructure -- the wholesaler cannot grant seller terms on the seller's behalf.",
      };
    }
    return {
      available: true,
      reason: "The wholesaler has confirmed control of a valid contract, and the underlying seller has approved a restructure.",
    };
  }

  // REFERRAL, INVESTOR, UNKNOWN, or not yet set -- unknown is never treated as approval.
  if (facts.sellerApprovalForTerms === "YES") {
    return { available: true, reason: "Seller cooperation for creative terms has been confirmed for this source." };
  }
  return { available: false, reason: "Seller cooperation for creative terms has not been confirmed for this source." };
}

export function determineAvailableStrategies(facts: ContractControlFacts): StrategyAvailability[] {
  const sellerCoop = sellerCooperationAvailability(facts);

  const results: Record<StrategyId, StrategyAvailability> = {} as Record<StrategyId, StrategyAvailability>;

  for (const strategy of ["CASH_PURCHASE", "BRRRR", "DSCR_RENTAL"] as StrategyId[]) {
    results[strategy] = {
      strategy,
      available: true,
      reason: "Doesn't require seller cooperation beyond a standard purchase and closing.",
    };
  }

  for (const strategy of SELLER_COOPERATION_STRATEGIES) {
    results[strategy] = { strategy, ...sellerCoop };
  }

  results.WHOLESALE_ASSIGNMENT = facts.assignmentPermitted === false
    ? { strategy: "WHOLESALE_ASSIGNMENT", available: false, reason: "The underlying contract does not permit assignment." }
    : { strategy: "WHOLESALE_ASSIGNMENT", available: true, reason: facts.assignmentPermitted === true
        ? "Assignment is confirmed permitted under the contract."
        : "Assignability has not been confirmed -- verify the contract's assignment clause before marketing it." };

  results.DOUBLE_CLOSE = {
    strategy: "DOUBLE_CLOSE",
    available: true,
    reason: "Taking title yourself doesn't require assignment rights, though it requires funds (or transactional funding) to close twice.",
  };

  results.RENEGOTIATED_WHOLESALE = facts.sourceType === "WHOLESALER"
    ? { strategy: "RENEGOTIATED_WHOLESALE", available: true, reason: "This deal came from a wholesaler contract, so the contract price and/or assignment fee can potentially be renegotiated." }
    : { strategy: "RENEGOTIATED_WHOLESALE", available: false, reason: "This deal was not sourced from a wholesaler contract, so there is no assignment to renegotiate." };

  return ALL_STRATEGIES.map((s) => results[s] ?? { strategy: s, available: false, reason: `${STRATEGY_LABELS[s]} is not yet modeled.` });
}
