import { describe, expect, it } from "vitest";
import { runStressTest, type StressTestInputs } from "../stressTest";
import {
  DEMO_FINANCING, DEMO_PURCHASE_PRICE, DEMO_RENT, DEMO_REQUIREMENTS, DEMO_VALUE_ARV, demoRehabTotal,
} from "@/lib/demoData";

describe("runStressTest", () => {
  const inputs: StressTestInputs = {
    arv: DEMO_VALUE_ARV.brrrUnderwritingArv!.value,
    rehabTotal: demoRehabTotal(),
    hardMoneyTerms: DEMO_FINANCING.hardMoney,
    refinanceTerms: DEMO_FINANCING.refinance,
    expenses: DEMO_FINANCING.expenses,
    rentMonthly: DEMO_RENT.market.likelyRent!.value,
    holdPeriodMonths: DEMO_FINANCING.holdPeriodMonths,
    requirements: DEMO_REQUIREMENTS,
    purchasePrice: DEMO_PURCHASE_PRICE,
  };

  const scenarios = runStressTest(inputs);

  it("runs the base case plus 6 stress scenarios", () => {
    expect(scenarios).toHaveLength(7);
  });

  it("every scenario gets a plain-language verdict", () => {
    for (const s of scenarios) {
      expect(["SURVIVES", "TIGHT", "FAILS"]).toContain(s.verdict);
    }
  });

  it("the combined worst case is never better than the base case", () => {
    const base = scenarios[0]!;
    const worst = scenarios[scenarios.length - 1]!;
    expect(worst.cashRemainingInProperty).toBeGreaterThanOrEqual(base.cashRemainingInProperty - 0.01);
    expect(worst.postRefiCashFlowMonthly).toBeLessThanOrEqual(base.postRefiCashFlowMonthly + 0.01);
  });
});
