import type { AcquisitionPriceResult } from "./acquisitionPrice";
import type { StressScenario } from "./stressTest";

export type DecisionVerdict = "STRONG_FIT" | "NEEDS_WORK" | "DOESNT_FIT";

export interface DecisionResult {
  verdict: DecisionVerdict;
  headline: string;
  explanation: string;
  nextActions: string[];
}

/**
 * Never says "buy this." Compares asking price against the acquisition-price ceiling and
 * folds in the stress test, per spec section 24.
 */
export function evaluateDecision(
  acquisition: AcquisitionPriceResult,
  stressScenarios: StressScenario[],
  openDealKillerCount: number
): DecisionResult {
  const asking = acquisition.askingPrice;
  const worst = stressScenarios[stressScenarios.length - 1];
  const nextActions: string[] = [];

  if (openDealKillerCount > 0) {
    nextActions.push(`Resolve ${openDealKillerCount} open deal-killer flag${openDealKillerCount > 1 ? "s" : ""} before making an offer.`);
  }

  if (asking === undefined) {
    nextActions.push("Enter an asking price to compare against the acquisition price ceiling.");
    return {
      verdict: "NEEDS_WORK",
      headline: "Add an asking price to get a decision",
      explanation: "We can calculate what you could safely pay, but we need the seller's asking price to compare against it.",
      nextActions,
    };
  }

  const cashAtAsking = acquisition.projectionAtAsking;
  const fitsAtAsking = cashAtAsking?.meetsAllRequirements ?? false;

  if (fitsAtAsking && worst?.verdict !== "FAILS" && openDealKillerCount === 0) {
    nextActions.push(`Offer at or below $${Math.round(acquisition.idealAcquisition).toLocaleString()} to keep the full BRRRR outcome intact.`);
    return {
      verdict: "STRONG_FIT",
      headline: "This deal fits your requirements at the current asking price",
      explanation: `At the $${Math.round(asking).toLocaleString()} asking price, the deal still meets your cash-left, equity, and cash-flow requirements, and it holds up under stress testing.`,
      nextActions,
    };
  }

  if (asking <= acquisition.maximumAcquisition) {
    nextActions.push(`Target an offer around $${Math.round(acquisition.targetOffer).toLocaleString()}, and do not exceed $${Math.round(acquisition.maximumAcquisition).toLocaleString()} based on current assumptions.`);
    return {
      verdict: "STRONG_FIT",
      headline: "This deal fits your requirements",
      explanation: `Paying up to $${Math.round(acquisition.maximumAcquisition).toLocaleString()} keeps this property within the investment requirements you selected.`,
      nextActions,
    };
  }

  const diff = asking - acquisition.maximumAcquisition;
  const cashLeft = cashAtAsking?.cashRemainingInProperty ?? 0;

  if (diff / asking < 0.35) {
    nextActions.push(`Target offer: $${Math.round(acquisition.targetOffer).toLocaleString()}. Maximum: $${Math.round(acquisition.maximumAcquisition).toLocaleString()}.`);
    return {
      verdict: "NEEDS_WORK",
      headline: "This deal could work, but not at the current asking price",
      explanation: `This property could meet your investment goals around a $${Math.round(acquisition.maximumAcquisition).toLocaleString()} acquisition price, but at the current $${Math.round(asking).toLocaleString()} asking price approximately $${Math.round(cashLeft).toLocaleString()} would remain invested after refinance.`,
      nextActions,
    };
  }

  nextActions.push("Consider passing, or revisit rehab/ARV/rent assumptions to see what would need to change.");
  return {
    verdict: "DOESNT_FIT",
    headline: "This deal doesn't fit at the current asking price",
    explanation: `The gap between the $${Math.round(asking).toLocaleString()} asking price and the $${Math.round(acquisition.maximumAcquisition).toLocaleString()} maximum acquisition price is too large to close with a reasonable negotiation.`,
    nextActions,
  };
}
