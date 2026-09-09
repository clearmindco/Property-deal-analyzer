import type { HardMoneyTerms, InvestorRequirements, OperatingExpenseAssumptions, RefinanceTerms } from "@/lib/types/deal";
import { calculateHardMoneyLoan } from "./hardMoney";
import { calculateRefinance } from "./refinance";

export interface AcquisitionPriceInputs {
  arv: number; // use the conservative/BRRRR-underwriting ARV, not the upper band
  rehabTotal: number; // including contingency
  hardMoneyTerms: HardMoneyTerms;
  refinanceTerms: RefinanceTerms;
  expenses: OperatingExpenseAssumptions;
  rentMonthly: number;
  holdPeriodMonths: number;
  requirements: InvestorRequirements;
  askingPrice?: number;
  negotiationMarginPct?: number; // discount below "ideal" used for the opening offer, default 0.10
}

export interface AcquisitionPriceProjection {
  purchasePrice: number;
  cashInvested: number;
  cashRemainingInProperty: number;
  equityCreatedPct: number;
  postRefiCashFlowMonthly: number;
  meetsAllRequirements: boolean;
}

export interface AcquisitionPriceResult {
  targetOffer: number;
  idealAcquisition: number;
  maximumAcquisition: number;
  askingPrice?: number;
  differenceFromAsking?: number;
  projectionAtMaximum: AcquisitionPriceProjection;
  projectionAtAsking?: AcquisitionPriceProjection;
}

function projectAtPrice(
  purchasePrice: number,
  inputs: AcquisitionPriceInputs
): AcquisitionPriceProjection {
  const hm = calculateHardMoneyLoan(
    purchasePrice, inputs.rehabTotal, inputs.hardMoneyTerms, inputs.arv, inputs.holdPeriodMonths
  );
  const cashInvested = hm.cashToClose + hm.rehabCashRequired + hm.estimatedInterestDuringHold;
  const refi = calculateRefinance(
    inputs.arv, inputs.refinanceTerms, hm.totalLoan, cashInvested, inputs.rentMonthly, inputs.expenses
  );
  const allInCost = purchasePrice + inputs.rehabTotal + hm.pointsCost + hm.feesTotal + hm.estimatedInterestDuringHold;
  const equityCreatedPct = inputs.arv > 0 ? (inputs.arv - allInCost) / inputs.arv : 0;

  const meetsAllRequirements =
    refi.cashRemainingInProperty <= inputs.requirements.maxCashLeftInPropertyAfterRefi &&
    equityCreatedPct >= inputs.requirements.minEquityCreatedPct &&
    refi.postRefiCashFlowMonthly >= inputs.requirements.minMonthlyCashFlowPerDoor;

  return {
    purchasePrice,
    cashInvested,
    cashRemainingInProperty: refi.cashRemainingInProperty,
    equityCreatedPct,
    postRefiCashFlowMonthly: refi.postRefiCashFlowMonthly,
    meetsAllRequirements,
  };
}

/** Bisection search for the highest purchase price at which `satisfies` still holds true. */
function findMaxPriceSatisfying(
  satisfies: (price: number) => boolean,
  upperBound: number
): number {
  if (!satisfies(0)) return 0;
  if (satisfies(upperBound)) return upperBound;
  let lo = 0;
  let hi = upperBound;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (satisfies(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
 * Solves backward from the investor's requirements to find the acquisition price ceiling,
 * per spec section 23. Returns three prices:
 *  - maximumAcquisition: highest price where every selected requirement still holds.
 *  - idealAcquisition: highest price where, in addition, refinance returns ALL cash
 *    (cashRemainingInProperty === 0) -- the "textbook" BRRRR outcome.
 *  - targetOffer: a negotiation starting point below ideal (default 10% cushion).
 */
export function calculateAcquisitionPrice(inputs: AcquisitionPriceInputs): AcquisitionPriceResult {
  const upperBound = inputs.arv * 1.5 + inputs.rehabTotal;
  const margin = inputs.negotiationMarginPct ?? 0.10;

  const meetsMaxRequirements = (price: number) => {
    const p = projectAtPrice(price, inputs);
    return (
      p.cashRemainingInProperty <= inputs.requirements.maxCashLeftInPropertyAfterRefi &&
      p.equityCreatedPct >= inputs.requirements.minEquityCreatedPct &&
      p.postRefiCashFlowMonthly >= inputs.requirements.minMonthlyCashFlowPerDoor
    );
  };

  const meetsIdealRequirements = (price: number) => {
    const p = projectAtPrice(price, inputs);
    return (
      p.cashRemainingInProperty <= 0.01 &&
      p.equityCreatedPct >= inputs.requirements.minEquityCreatedPct &&
      p.postRefiCashFlowMonthly >= inputs.requirements.minMonthlyCashFlowPerDoor
    );
  };

  const maximumAcquisition = findMaxPriceSatisfying(meetsMaxRequirements, upperBound);
  const idealAcquisition = Math.min(
    findMaxPriceSatisfying(meetsIdealRequirements, upperBound),
    maximumAcquisition
  );
  const targetOffer = Math.max(0, idealAcquisition * (1 - margin));

  const projectionAtMaximum = projectAtPrice(maximumAcquisition, inputs);
  const projectionAtAsking = inputs.askingPrice !== undefined
    ? projectAtPrice(inputs.askingPrice, inputs)
    : undefined;

  return {
    targetOffer,
    idealAcquisition,
    maximumAcquisition,
    askingPrice: inputs.askingPrice,
    differenceFromAsking: inputs.askingPrice !== undefined ? inputs.askingPrice - maximumAcquisition : undefined,
    projectionAtMaximum,
    projectionAtAsking,
  };
}
