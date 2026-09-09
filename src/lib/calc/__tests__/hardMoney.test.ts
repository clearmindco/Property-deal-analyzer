import { describe, expect, it } from "vitest";
import { calculateHardMoneyLoan } from "../hardMoney";
import { DEMO_FINANCING, DEMO_PURCHASE_PRICE, DEMO_VALUE_ARV, demoRehabTotal } from "@/lib/demoData";

describe("calculateHardMoneyLoan (demo BRRRR example)", () => {
  const arv = DEMO_VALUE_ARV.brrrUnderwritingArv!.value;
  const rehabTotal = demoRehabTotal();
  const result = calculateHardMoneyLoan(
    DEMO_PURCHASE_PRICE, rehabTotal, DEMO_FINANCING.hardMoney, arv, DEMO_FINANCING.holdPeriodMonths
  );

  it("never lends more than the ARV LTV cap", () => {
    expect(result.totalLoan).toBeLessThanOrEqual(arv * DEMO_FINANCING.hardMoney.arvLtvCapPct! + 0.01);
  });

  it("never lends more than the LTC cap", () => {
    const totalCost = DEMO_PURCHASE_PRICE + rehabTotal;
    expect(result.totalLoan).toBeLessThanOrEqual(totalCost * DEMO_FINANCING.hardMoney.ltcCapPct! + 0.01);
  });

  it("produces a non-negative down payment and cash to close", () => {
    expect(result.downPayment).toBeGreaterThanOrEqual(0);
    expect(result.cashToClose).toBeGreaterThan(0);
  });

  it("computes points cost as points% of the actual (capped) loan, not the uncapped request", () => {
    expect(result.pointsCost).toBeCloseTo(result.totalLoan * (DEMO_FINANCING.hardMoney.points / 100), 2);
  });

  it("charges more fully-drawn interest than initial interest when rehab is financed", () => {
    expect(result.fullyDrawnMonthlyInterest).toBeGreaterThan(result.initialMonthlyInterest);
  });
});
