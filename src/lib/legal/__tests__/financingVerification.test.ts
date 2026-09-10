import { describe, expect, it } from "vitest";
import { effectiveFinancingFacts } from "@/lib/legal/financingVerification";
import { emptyLegalIntake } from "@/lib/types/legal";

describe("financing verification precedence", () => {
  // Scenario 7: verified value controls, seller-reported preserved in the record for the audit trail.
  it("prefers the verified value over the seller-reported value but keeps the seller-reported value visible", () => {
    const intake = { ...emptyLegalIntake(), sellerReportedMonthlyPayment: 1400, verifiedMonthlyPayment: 1523 };
    const facts = effectiveFinancingFacts(intake);
    expect(facts.monthlyPayment.value).toBe(1523);
    expect(facts.monthlyPayment.source).toBe("VERIFIED");
    expect(facts.monthlyPayment.sellerReportedValue).toBe(1400);
  });

  it("falls back to seller-reported when nothing has been verified yet", () => {
    const intake = { ...emptyLegalIntake(), sellerReportedLoanBalance: 152000, verifiedLoanBalance: null };
    const facts = effectiveFinancingFacts(intake);
    expect(facts.loanBalance.value).toBe(152000);
    expect(facts.loanBalance.source).toBe("SELLER_REPORTED");
  });

  it("reports unknown when neither value is present", () => {
    const facts = effectiveFinancingFacts(emptyLegalIntake());
    expect(facts.monthlyPayment.source).toBe("UNKNOWN");
    expect(facts.monthlyPayment.value).toBeNull();
  });
});
