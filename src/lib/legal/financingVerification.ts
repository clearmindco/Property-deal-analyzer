import type { EffectiveFinancingFacts, FinancingFact, LegalIntake } from "@/lib/types/legal";

// Verified-vs-seller-reported financing precedence: a value the investor has independently
// verified (mortgage statement, servicer call, title report) always controls over what the
// seller said from memory -- but the seller-reported value is never discarded. It stays in the
// record for the audit trail and so a human reviewer can see the two didn't match.

function resolveFact(verified: number | null, sellerReported: number | null): FinancingFact {
  if (verified !== null) {
    return { value: verified, source: "VERIFIED", sellerReportedValue: sellerReported };
  }
  if (sellerReported !== null) {
    return { value: sellerReported, source: "SELLER_REPORTED", sellerReportedValue: sellerReported };
  }
  return { value: null, source: "UNKNOWN", sellerReportedValue: null };
}

export function effectiveFinancingFacts(intake: LegalIntake): EffectiveFinancingFacts {
  return {
    monthlyPayment: resolveFact(intake.verifiedMonthlyPayment, intake.sellerReportedMonthlyPayment),
    loanBalance: resolveFact(intake.verifiedLoanBalance, intake.sellerReportedLoanBalance),
  };
}
