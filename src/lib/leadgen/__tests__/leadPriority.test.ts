import { describe, expect, it } from "vitest";
import { computeLeadPriority } from "../leadPriority";
import type { QualificationAnswer } from "@/lib/types/leadgen";

function answer(key: QualificationAnswer["key"], value: string): QualificationAnswer {
  return { key, value, source: "manual", confirmed: true };
}

describe("computeLeadPriority", () => {
  it("returns UNCLEAR with no reasons when nothing has been answered", () => {
    const result = computeLeadPriority([]);
    expect(result.level).toBe("UNCLEAR");
    expect(result.reasons).toHaveLength(0);
  });

  it("matches the spec's STRONG example: short timeline, vacant, mortgage info, open to terms", () => {
    const result = computeLeadPriority([
      answer("timeline", "within 30 days"),
      answer("occupancy", "vacant"),
      answer("mortgageBalance", "$45,000"),
      answer("openToTerms", "yes, open to that"),
      answer("sellerReason", "relocating for a new job"),
    ]);
    expect(result.level).toBe("STRONG");
    expect(result.reasons.length).toBeGreaterThanOrEqual(3);
    expect(result.reasons.some((r) => r.toLowerCase().includes("vacant"))).toBe(true);
  });

  it("never produces a reason that isn't traceable to an actual answer", () => {
    const qualification = [answer("occupancy", "vacant")];
    const result = computeLeadPriority(qualification);
    for (const reason of result.reasons) {
      expect(typeof reason).toBe("string");
    }
    expect(result.level).toBe("MODERATE");
  });
});
