import type { HardMoneyTerms, InvestorRequirements, OperatingExpenseAssumptions, RefinanceTerms } from "@/lib/types/deal";
import { calculateAcquisitionPrice, type AcquisitionPriceInputs } from "./acquisitionPrice";

export type StressVerdict = "SURVIVES" | "TIGHT" | "FAILS";

export interface StressScenario {
  name: string;
  rehabTotal: number;
  arv: number;
  rentMonthly: number;
  refinanceTerms: RefinanceTerms;
  holdPeriodMonths: number;
  cashRemainingInProperty: number;
  postRefiCashFlowMonthly: number;
  verdict: StressVerdict;
}

export interface StressTestInputs {
  arv: number;
  rehabTotal: number;
  hardMoneyTerms: HardMoneyTerms;
  refinanceTerms: RefinanceTerms;
  expenses: OperatingExpenseAssumptions;
  rentMonthly: number;
  holdPeriodMonths: number;
  requirements: InvestorRequirements;
  purchasePrice: number;
}

function classify(cashRemaining: number, maxAllowed: number, cashFlow: number, minCashFlow: number): StressVerdict {
  const cashFlowOk = cashFlow >= minCashFlow;
  const cashOk = cashRemaining <= maxAllowed;
  if (cashFlowOk && cashOk) return "SURVIVES";
  const cashFlowClose = cashFlow >= minCashFlow - 100;
  const cashClose = cashRemaining <= maxAllowed * 1.25 || cashRemaining <= maxAllowed + 5000;
  if (cashFlowClose && cashClose) return "TIGHT";
  return "FAILS";
}

function runScenario(name: string, inputs: StressTestInputs): StressScenario {
  const priceInputs: AcquisitionPriceInputs = {
    arv: inputs.arv,
    rehabTotal: inputs.rehabTotal,
    hardMoneyTerms: inputs.hardMoneyTerms,
    refinanceTerms: inputs.refinanceTerms,
    expenses: inputs.expenses,
    rentMonthly: inputs.rentMonthly,
    holdPeriodMonths: inputs.holdPeriodMonths,
    requirements: inputs.requirements,
    askingPrice: inputs.purchasePrice,
  };
  const result = calculateAcquisitionPrice(priceInputs);
  const projection = result.projectionAtAsking!;
  const verdict = classify(
    projection.cashRemainingInProperty,
    inputs.requirements.maxCashLeftInPropertyAfterRefi,
    projection.postRefiCashFlowMonthly,
    inputs.requirements.minMonthlyCashFlowPerDoor
  );
  return {
    name,
    rehabTotal: inputs.rehabTotal,
    arv: inputs.arv,
    rentMonthly: inputs.rentMonthly,
    refinanceTerms: inputs.refinanceTerms,
    holdPeriodMonths: inputs.holdPeriodMonths,
    cashRemainingInProperty: projection.cashRemainingInProperty,
    postRefiCashFlowMonthly: projection.postRefiCashFlowMonthly,
    verdict,
  };
}

/** Default stress scenarios per spec section 22: rehab +20%, ARV -10%, rent -10%, refi rate +1%, hold +3mo. */
export function runStressTest(base: StressTestInputs): StressScenario[] {
  const scenarios: StressScenario[] = [];

  scenarios.push(runScenario("Base case", base));

  scenarios.push(runScenario("Rehab +20%", {
    ...base,
    rehabTotal: base.rehabTotal * 1.2,
  }));

  scenarios.push(runScenario("ARV -10%", {
    ...base,
    arv: base.arv * 0.9,
  }));

  scenarios.push(runScenario("Rent -10%", {
    ...base,
    rentMonthly: base.rentMonthly * 0.9,
  }));

  scenarios.push(runScenario("Refi rate +1%", {
    ...base,
    refinanceTerms: { ...base.refinanceTerms, ratePct: base.refinanceTerms.ratePct + 0.01 },
  }));

  scenarios.push(runScenario("Hold period +3 months", {
    ...base,
    holdPeriodMonths: base.holdPeriodMonths + 3,
  }));

  scenarios.push(runScenario("All combined (worst case)", {
    ...base,
    rehabTotal: base.rehabTotal * 1.2,
    arv: base.arv * 0.9,
    rentMonthly: base.rentMonthly * 0.9,
    refinanceTerms: { ...base.refinanceTerms, ratePct: base.refinanceTerms.ratePct + 0.01 },
    holdPeriodMonths: base.holdPeriodMonths + 3,
  }));

  return scenarios;
}
