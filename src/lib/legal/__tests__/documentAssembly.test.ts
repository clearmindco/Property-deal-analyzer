import { describe, expect, it } from "vitest";
import { assembleDocumentBody, buildDocumentFieldsSnapshot } from "@/lib/legal/documentAssembly";
import { buildPlaceholderBody, NEVER_TEMPLATED_KEYS, TEMPLATE_REGISTRY } from "@/lib/legal/templateRegistry";
import { emptyLegalIntake } from "@/lib/types/legal";

describe("document field snapshot", () => {
  it("never invents a value -- unknown facts render as an explicit not-provided marker", () => {
    const fields = buildDocumentFieldsSnapshot({
      dealAddress: "123 Main St", askingPrice: null, transactionType: "SUBJECT_TO", intake: emptyLegalIntake(),
    });
    expect(fields["Asking price"]).toBe("[NOT YET PROVIDED]");
    expect(fields["Existing loan balance"]).toBe("[NOT YET PROVIDED]");
  });

  it("prefers the verified financing fact and shows its source", () => {
    const intake = { ...emptyLegalIntake(), sellerReportedMonthlyPayment: 1200, verifiedMonthlyPayment: 1350 };
    const fields = buildDocumentFieldsSnapshot({
      dealAddress: "123 Main St", askingPrice: 150000, transactionType: "SUBJECT_TO", intake,
    });
    expect(fields["Existing monthly payment"]).toContain("1,350");
    expect(fields["Existing monthly payment"]).toContain("verified");
  });

  it("carries the deal address and seller name through untouched", () => {
    const fields = buildDocumentFieldsSnapshot({
      dealAddress: "456 Oak Ave", askingPrice: 200000, transactionType: "CASH_PURCHASE", intake: emptyLegalIntake(), sellerName: "Jane Seller",
    });
    expect(fields["Property address"]).toBe("456 Oak Ave");
    expect(fields["Seller name"]).toBe("Jane Seller");
  });
});

describe("document body assembly", () => {
  it("substitutes the fields block and attorney review status into the template", () => {
    const body = buildPlaceholderBody("Purchase agreement");
    const assembled = assembleDocumentBody(body, { "Property address": "123 Main St" }, "DRAFT_NOT_REVIEWED");
    expect(assembled).toContain("123 Main St");
    expect(assembled).toContain("Draft -- not attorney reviewed");
    expect(assembled).not.toContain("{{");
  });

  it("marks an unknown token explicitly rather than leaving it blank", () => {
    const assembled = assembleDocumentBody("Hello {{NOT_A_REAL_TOKEN}}", {}, "DRAFT_NOT_REVIEWED");
    expect(assembled).toBe("Hello [MISSING: NOT_A_REAL_TOKEN]");
  });

  it("never contains real contract language -- every registry template is framed as a non-functional placeholder", () => {
    for (const entry of TEMPLATE_REGISTRY) {
      const body = buildPlaceholderBody(entry.name);
      expect(body).toMatch(/PLACEHOLDER/i);
      expect(body).toMatch(/DO NOT SIGN/i);
      expect(body).toMatch(/nothing here is\s+enforceable/i);
    }
  });

  it("excludes distressed-property documents from the generic registry entirely", () => {
    expect(TEMPLATE_REGISTRY.some((e) => NEVER_TEMPLATED_KEYS.includes(e.key))).toBe(false);
  });
});
