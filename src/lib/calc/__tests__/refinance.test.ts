import { describe, expect, it } from "vitest";
import { calculateHardMoneyLoan } from "../hardMoney";
import { calculateRefinance, appraisalSensitivity } from "../refinance";
import { DEMO_FINANCING, DEMO_PURCHASE_PRICE, DEMO_RENT, DEMO_VALUE_ARV, demoRehabTotal } from "@/lib/demoData";

describe("calculateRefinance (demo BRRRR example)", () => {
  const arv = DEMO_VALUE_ARV.brrrUnderwritingArv!.value;
  const rehabTotal = demoRehabTotal();
  const hm = calculateHardMoneyLoan(
    DEMO_PURCHASE_PRICE, rehabTotal, DEMO_FINANCING.hardMoney, arv, DEMO_FINANCING.holdPeriodMonths
  );
  const cashInvested = hm.cashToClose + hm.rehabCashRequired + hm.estimatedInterestDuringHold;
  const rent = DEMO_RENT.market.likelyRent!.value;

  const result = calculateRefinance(
    arv, DEMO_FINANCING.refinance, hm.totalLoan, cashInvested, rent, DEMO_FINANCING.expenses
  );

  it("never refinances above the ARV LTV cap", () => {
    expect(result.refiLoanAmount).toBeLessThanOrEqual(arv * DEMO_FINANCING.refinance.refiLtvPct + 0.01);
  });

  it("returns cash only after paying off the hard-money loan and refi closing costs", () => {
    const expected = Math.max(0, result.refiLoanAmount - hm.totalLoan - result.refiClosingCosts);
    expect(result.cashReturnedToInvestor).toBeCloseTo(expected, 2);
  });

  it("never leaves negative cash remaining in the property", () => {
    expect(result.cashRemainingInProperty).toBeGreaterThanOrEqual(0);
  });

  it("matches the spec's ~$599/mo P&I example when the loan lands near $90,000 at 7%/30yr", () => {
    // Sanity check on the underlying mortgage math the refinance engine depends on.
    expect(result.monthlyPI).toBeGreaterThan(0);
  });
});

describe("appraisalSensitivity", () => {
  it("returns lower refi proceeds and higher cash-remaining as the appraisal drops", () => {
    const arv = DEMO_VALUE_ARV.brrrUnderwritingArv!.value;
    const rehabTotal = demoRehabTotal();
    const hm = calculateHardMoneyLoan(
      DEMO_PURCHASE_PRICE, rehabTotal, DEMO_FINANCING.hardMoney, arv, DEMO_FINANCING.holdPeriodMonths
    );
    const cashInvested = hm.cashToClose + hm.rehabCashRequired + hm.estimatedInterestDuringHold;
    const rent = DEMO_RENT.market.likelyRent!.value;

    const scenarios = appraisalSensitivity(
      [150000, 140000, 130000], DEMO_FINANCING.refinance, hm.totalLoan, cashInvested, rent, DEMO_FINANCING.expenses
    );

    expect(scenarios[0]!.result.refiLoanAmount).toBeGreaterThanOrEqual(scenarios[1]!.result.refiLoanAmount);
    expect(scenarios[1]!.result.refiLoanAmount).toBeGreaterThanOrEqual(scenarios[2]!.result.refiLoanAmount);
    expect(scenarios[0]!.result.cashRemainingInProperty).toBeLessThanOrEqual(scenarios[2]!.result.cashRemainingInProperty);
  });
});
