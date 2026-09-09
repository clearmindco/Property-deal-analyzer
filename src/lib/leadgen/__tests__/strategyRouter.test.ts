import { describe, expect, it } from "vitest";
import { routeStrategy } from "../strategyRouter";
import { computeLeadPriority } from "../leadPriority";
import type { QualificationAnswer } from "@/lib/types/leadgen";

function answer(key: QualificationAnswer["key"], value: string): QualificationAnswer {
  return { key, value, source: "manual", confirmed: true };
}

describe("routeStrategy", () => {
  it("never recommends a terms-based lane when the seller is cash-only", () => {
    const qualification = [
      answer("termsResponse", "CASH_ONLY"),
      answer("condition", "good condition"),
    ];
    const result = routeStrategy(qualification, computeLeadPriority(qualification));
    expect(result.recommended).not.toContain("SELLER_FINANCE");
    expect(result.recommended).not.toContain("SUBJECT_TO");
    expect(result.recommended).not.toContain("HYBRID");
    expect(result.recommended).not.toContain("LEASE_OPTION");
    expect(result.recommended).toContain("CASH_BRRRR");
  });

  it("routes toward Subject-To when the mortgage balance is close to the asking price and seller is open to terms", () => {
    const qualification = [
      answer("termsResponse", "OPEN_TO_TERMS"),
      answer("askingPrice", "$150,000"),
      answer("mortgageBalance", "$140,000"),
    ];
    const result = routeStrategy(qualification, computeLeadPriority(qualification));
    expect(result.recommended).toContain("SUBJECT_TO");
  });

  it("routes toward Seller Finance when there is meaningful equity and seller is open to terms", () => {
    const qualification = [
      answer("termsResponse", "OPEN_TO_TERMS"),
      answer("askingPrice", "$200,000"),
      answer("mortgageBalance", "$50,000"),
    ];
    const result = routeStrategy(qualification, computeLeadPriority(qualification));
    expect(result.recommended).toContain("SELLER_FINANCE");
  });

  it("allows PASS as a legitimate outcome for a cash-only, unclear-motivation lead", () => {
    const qualification = [answer("termsResponse", "CASH_ONLY")];
    const result = routeStrategy(qualification, computeLeadPriority(qualification));
    expect(result.recommended).toContain("PASS");
  });

  it("flags needsMoreInfo when financials and terms response are both unknown", () => {
    const result = routeStrategy([], computeLeadPriority([]));
    expect(result.needsMoreInfo).toBe(true);
  });

  it("never silently defaults to a creative-finance lane without seller input", () => {
    const result = routeStrategy([], computeLeadPriority([]));
    expect(result.recommended).not.toContain("SELLER_FINANCE");
    expect(result.recommended).not.toContain("SUBJECT_TO");
  });
});
