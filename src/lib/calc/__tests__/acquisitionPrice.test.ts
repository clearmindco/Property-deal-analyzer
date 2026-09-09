import { describe, expect, it } from "vitest";
import { calculateAcquisitionPrice, type AcquisitionPriceInputs } from "../acquisitionPrice";
import {
  DEMO_FINANCING, DEMO_PURCHASE_PRICE, DEMO_RENT, DEMO_REQUIREMENTS, DEMO_VALUE_ARV, demoRehabTotal,
} from "@/lib/demoData";

function demoInputs(): AcquisitionPriceInputs {
  return {
    arv: DEMO_VALUE_ARV.brrrUnderwritingArv!.value,
    rehabTotal: demoRehabTotal(),
    hardMoneyTerms: DEMO_FINANCING.hardMoney,
    refinanceTerms: DEMO_FINANCING.refinance,
    expenses: DEMO_FINANCING.expenses,
    rentMonthly: DEMO_RENT.market.likelyRent!.value,
    holdPeriodMonths: DEMO_FINANCING.holdPeriodMonths,
    requirements: DEMO_REQUIREMENTS,
    askingPrice: DEMO_PURCHASE_PRICE,
  };
}

describe("calculateAcquisitionPrice", () => {
  const result = calculateAcquisitionPrice(demoInputs());

  it("orders the three prices target <= ideal <= maximum", () => {
    expect(result.targetOffer).toBeLessThanOrEqual(result.idealAcquisition + 0.01);
    expect(result.idealAcquisition).toBeLessThanOrEqual(result.maximumAcquisition + 0.01);
  });

  it("the maximum acquisition price actually satisfies every investor requirement", () => {
    expect(result.projectionAtMaximum.meetsAllRequirements).toBe(true);
  });

  it("never recommends paying more than roughly the ARV plus rehab budget", () => {
    expect(result.maximumAcquisition).toBeLessThanOrEqual(demoInputs().arv * 1.5 + demoInputs().rehabTotal);
  });

  it("increasing the allowed cash-left-in-property raises the maximum acquisition price", () => {
    const looser = calculateAcquisitionPrice({
      ...demoInputs(),
      requirements: { ...DEMO_REQUIREMENTS, maxCashLeftInPropertyAfterRefi: 50000 },
    });
    expect(looser.maximumAcquisition).toBeGreaterThanOrEqual(result.maximumAcquisition);
  });

  it("reports a difference from asking when an asking price is provided", () => {
    expect(result.differenceFromAsking).toBeCloseTo(DEMO_PURCHASE_PRICE - result.maximumAcquisition, 2);
  });
});
