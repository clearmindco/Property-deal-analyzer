import { describe, expect, it } from "vitest";
import { monthlyPI, principalFromMonthlyPayment } from "../mortgage";

describe("monthlyPI", () => {
  it("matches the spec's demo example: $90,000 at 7% for 30 years is about $599/mo", () => {
    const pi = monthlyPI(90000, 0.07, 30);
    expect(pi).toBeGreaterThan(595);
    expect(pi).toBeLessThan(603);
  });

  it("handles a 0% rate as a simple straight-line payment", () => {
    expect(monthlyPI(12000, 0, 10)).toBeCloseTo(100, 5);
  });

  it("returns 0 for a non-positive principal", () => {
    expect(monthlyPI(0, 0.07, 30)).toBe(0);
    expect(monthlyPI(-100, 0.07, 30)).toBe(0);
  });
});

describe("principalFromMonthlyPayment", () => {
  it("inverts monthlyPI", () => {
    const principal = 200000;
    const rate = 0.065;
    const term = 30;
    const payment = monthlyPI(principal, rate, term);
    const inverted = principalFromMonthlyPayment(payment, rate, term);
    expect(inverted).toBeCloseTo(principal, 2);
  });
});
