import { describe, expect, it } from "vitest";
import { dscr, maxLoanByDscr } from "../dscr";
import { monthlyPI } from "../mortgage";

describe("dscr", () => {
  it("computes NOI / debt service", () => {
    expect(dscr(24000, 20000)).toBeCloseTo(1.2, 5);
  });

  it("returns Infinity when there is no debt service", () => {
    expect(dscr(24000, 0)).toBe(Infinity);
  });
});

describe("maxLoanByDscr", () => {
  it("produces a loan whose payment satisfies the DSCR floor", () => {
    const noi = 24000;
    const minDscr = 1.25;
    const rate = 0.07;
    const term = 30;
    const loan = maxLoanByDscr(noi, minDscr, rate, term);
    const annualDebtService = monthlyPI(loan, rate, term) * 12;
    expect(noi / annualDebtService).toBeCloseTo(minDscr, 2);
  });
});
