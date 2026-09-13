import type { StrategyEngineInputs, StrategyId, StrategyResult } from "@/lib/types/strategy";
import { STRATEGY_LABELS } from "@/lib/types/strategy";
import { determineAvailableStrategies } from "./strategyAvailability";
import { computeRescueOptions, type RescueContext } from "./dealRescue";
import { calculateAcquisitionPrice } from "@/lib/calc/acquisitionPrice";
import { calculateCashFlow } from "@/lib/calc/cashFlow";
import { analyzeDscrRental } from "@/lib/calc/dscrRental";
import { analyzeWrap } from "@/lib/calc/wrapFinancing";
import { analyzeHybrid, analyzeSellerFinance, analyzeSubjectTo } from "@/lib/calc/creativeFinance";
import { operatingExpenseBreakdown } from "@/lib/calc/noi";

// Master Deal Structuring Engine orchestrator: runs every strategy the authority gate allows,
// never assumes a strategy from the lead source, and always reverse-solves a rescue path
// instead of stopping at FAIL. This is the one place that ties the availability gate, each
// per-strategy calculator, and the rescue engine together -- keep the wiring order here, not
// duplicated at call sites.

const NOT_MODELED_STRATEGIES: StrategyId[] = ["WHOLESALE_ASSIGNMENT", "DOUBLE_CLOSE", "LEASE_OPTION", "RENEGOTIATED_WHOLESALE"];

function riskFromCashFlow(cashFlow: number, target: number): "LOW" | "MODERATE" | "HIGH" {
  if (cashFlow >= target * 1.5) return "LOW";
  if (cashFlow >= target) return "MODERATE";
  return "HIGH";
}

export function evaluateAllStrategies(inputs: StrategyEngineInputs): StrategyResult[] {
  const availability = determineAvailableStrategies(inputs.contractControl);
  const results: StrategyResult[] = [];

  for (const a of availability) {
    if (!a.available) {
      results.push({
        strategy: a.strategy, available: false, availabilityReason: a.reason,
        verdict: "NEEDS_INFO", monthlyCashFlow: null, cashRequired: null, risk: null,
        reasoning: [a.reason], rescueOptions: [],
      });
      continue;
    }

    if (NOT_MODELED_STRATEGIES.includes(a.strategy)) {
      results.push({
        strategy: a.strategy, available: true, availabilityReason: a.reason,
        verdict: "NEEDS_INFO", monthlyCashFlow: null, cashRequired: null, risk: null,
        reasoning: [`${STRATEGY_LABELS[a.strategy]} is available for this deal but isn't numerically modeled yet -- evaluate it manually before ruling it out.`],
        rescueOptions: [],
      });
      continue;
    }

    results.push(evaluateOne(a.strategy, a.reason, inputs));
  }

  return results;
}

function evaluateOne(strategy: StrategyId, availabilityReason: string, inputs: StrategyEngineInputs): StrategyResult {
  const base = { strategy, available: true, availabilityReason };

  if (strategy === "CASH_PURCHASE") {
    if (!inputs.askingPrice) {
      return { ...base, verdict: "NEEDS_INFO", monthlyCashFlow: null, cashRequired: null, risk: null, reasoning: ["Enter an asking price to evaluate a cash purchase."], rescueOptions: [] };
    }
    const cashRequired = inputs.askingPrice + inputs.rehabTotal;
    const cashFlow = calculateCashFlow(inputs.rentMonthly, 0, inputs.expenses);
    const verdict = cashFlow.netMonthlyCashFlow >= inputs.targetCashFlow ? "PASS" : "FAIL";
    const rescueCtx: RescueContext = {
      rentMonthly: inputs.rentMonthly, expenses: inputs.expenses, targetCashFlow: inputs.targetCashFlow,
      currentCashFlow: cashFlow.netMonthlyCashFlow, currentDebtService: 0,
      wholesaleEndBuyerMaxPrice: inputs.wholesaleEndBuyerMaxPrice, currentTotalAcquisitionPrice: inputs.currentTotalAcquisitionPrice,
    };
    return {
      ...base, verdict, monthlyCashFlow: cashFlow.netMonthlyCashFlow, cashRequired,
      risk: riskFromCashFlow(cashFlow.netMonthlyCashFlow, inputs.targetCashFlow),
      reasoning: [`All-cash purchase with no debt service -- cash flow is ${cashFlow.netMonthlyCashFlow >= 0 ? "positive" : "negative"} at ${Math.round(cashFlow.netMonthlyCashFlow)}/mo, but requires ${Math.round(cashRequired).toLocaleString()} in cash.`],
      rescueOptions: verdict === "FAIL" ? computeRescueOptions(rescueCtx) : [],
    };
  }

  if (strategy === "BRRRR") {
    const acquisition = calculateAcquisitionPrice({
      arv: inputs.arv, rehabTotal: inputs.rehabTotal, hardMoneyTerms: inputs.hardMoneyTerms,
      refinanceTerms: inputs.refinanceTerms, expenses: inputs.expenses, rentMonthly: inputs.rentMonthly,
      holdPeriodMonths: inputs.holdPeriodMonths, requirements: inputs.requirements, askingPrice: inputs.askingPrice,
    });
    const projection = acquisition.projectionAtAsking;
    if (!projection) {
      return { ...base, verdict: "NEEDS_INFO", monthlyCashFlow: null, cashRequired: null, risk: null, reasoning: ["Enter an asking price to evaluate BRRRR at the current offer."], rescueOptions: [] };
    }
    const verdict = projection.postRefiCashFlowMonthly >= inputs.targetCashFlow ? "PASS" : "FAIL";
    const expenseBreakdown = operatingExpenseBreakdown(inputs.rentMonthly, inputs.expenses);
    const impliedDebtService = inputs.rentMonthly - expenseBreakdown.totalMonthly - projection.postRefiCashFlowMonthly;
    const rescueCtx: RescueContext = {
      rentMonthly: inputs.rentMonthly, expenses: inputs.expenses, targetCashFlow: inputs.targetCashFlow,
      currentCashFlow: projection.postRefiCashFlowMonthly,
      currentDebtService: impliedDebtService,
      brrrMaxAcquisition: acquisition.maximumAcquisition,
      wholesaleEndBuyerMaxPrice: inputs.wholesaleEndBuyerMaxPrice, currentTotalAcquisitionPrice: inputs.currentTotalAcquisitionPrice,
    };
    return {
      ...base, verdict, monthlyCashFlow: projection.postRefiCashFlowMonthly, cashRequired: projection.cashRemainingInProperty,
      risk: riskFromCashFlow(projection.postRefiCashFlowMonthly, inputs.targetCashFlow),
      reasoning: [`Post-refinance cash flow projected at ${Math.round(projection.postRefiCashFlowMonthly)}/mo with ${Math.round(projection.cashRemainingInProperty).toLocaleString()} left in the property. Maximum acquisition price to meet your requirements is ${Math.round(acquisition.maximumAcquisition).toLocaleString()}.`],
      rescueOptions: verdict === "FAIL" ? computeRescueOptions(rescueCtx) : [],
    };
  }

  if (strategy === "DSCR_RENTAL") {
    if (!inputs.dscrTerms) {
      return { ...base, verdict: "NEEDS_INFO", monthlyCashFlow: null, cashRequired: null, risk: null, reasoning: ["Enter DSCR loan terms (down payment %, rate, term) to evaluate this strategy."], rescueOptions: [] };
    }
    const result = analyzeDscrRental(inputs.dscrTerms, inputs.rentMonthly, inputs.expenses);
    const verdict = result.cashFlow.netMonthlyCashFlow >= inputs.targetCashFlow && result.meetsMinDscr ? "PASS" : "FAIL";
    const rescueCtx: RescueContext = {
      rentMonthly: inputs.rentMonthly, expenses: inputs.expenses, targetCashFlow: inputs.targetCashFlow,
      currentCashFlow: result.cashFlow.netMonthlyCashFlow, currentDebtService: result.monthlyPI,
      debtRatePct: inputs.dscrTerms.ratePct, debtTermYears: inputs.dscrTerms.termYears, currentDownPayment: result.downPayment,
      wholesaleEndBuyerMaxPrice: inputs.wholesaleEndBuyerMaxPrice, currentTotalAcquisitionPrice: inputs.currentTotalAcquisitionPrice,
    };
    return {
      ...base, verdict, monthlyCashFlow: result.cashFlow.netMonthlyCashFlow, cashRequired: result.cashRequired,
      risk: riskFromCashFlow(result.cashFlow.netMonthlyCashFlow, inputs.targetCashFlow),
      reasoning: [`DSCR ${result.dscrValue.toFixed(2)} against a ${result.minDscr.toFixed(2)} minimum, cash flow ${Math.round(result.cashFlow.netMonthlyCashFlow)}/mo, ${Math.round(result.cashRequired).toLocaleString()} cash required.`],
      rescueOptions: verdict === "FAIL" ? computeRescueOptions(rescueCtx) : [],
    };
  }

  if (strategy === "SELLER_FINANCE" || strategy === "SUBJECT_TO" || strategy === "HYBRID") {
    const result = strategy === "SELLER_FINANCE"
      ? analyzeSellerFinance(inputs.creativeFinance.sellerFinance, inputs.arv, inputs.rentMonthly, inputs.expenses)
      : strategy === "SUBJECT_TO"
      ? analyzeSubjectTo(inputs.creativeFinance.subjectTo, inputs.arv, inputs.rentMonthly, inputs.expenses)
      : analyzeHybrid(inputs.creativeFinance.hybrid, inputs.arv, inputs.rentMonthly, inputs.expenses);
    if (!result.applicable) {
      return { ...base, verdict: "NEEDS_INFO", monthlyCashFlow: null, cashRequired: null, risk: null, reasoning: [result.blockedReason ?? "Enter terms to evaluate this structure."], rescueOptions: [] };
    }
    const cashFlow = result.cashFlow!.netMonthlyCashFlow;
    const verdict = cashFlow >= inputs.targetCashFlow ? "PASS" : "FAIL";
    const rescueCtx: RescueContext = {
      rentMonthly: inputs.rentMonthly, expenses: inputs.expenses, targetCashFlow: inputs.targetCashFlow,
      currentCashFlow: cashFlow, currentDebtService: result.monthlyDebtService,
      wholesaleEndBuyerMaxPrice: inputs.wholesaleEndBuyerMaxPrice, currentTotalAcquisitionPrice: inputs.currentTotalAcquisitionPrice,
    };
    return {
      ...base, verdict, monthlyCashFlow: cashFlow, cashRequired: result.cashToClose,
      risk: riskFromCashFlow(cashFlow, inputs.targetCashFlow),
      reasoning: [`Cash flow ${Math.round(cashFlow)}/mo, ${Math.round(result.cashToClose).toLocaleString()} cash to close.`, ...result.riskFlags],
      rescueOptions: verdict === "FAIL" ? computeRescueOptions(rescueCtx) : [],
    };
  }

  if (strategy === "WRAP") {
    if (!inputs.wrapTerms) {
      return { ...base, verdict: "NEEDS_INFO", monthlyCashFlow: null, cashRequired: null, risk: null, reasoning: ["Enter wrap note terms (down payment, wrap rate, wrap term) to evaluate this structure."], rescueOptions: [] };
    }
    const result = analyzeWrap(inputs.wrapTerms, inputs.rentMonthly, inputs.expenses);
    const cashFlow = result.cashFlow.netMonthlyCashFlow;
    const verdict = cashFlow >= inputs.targetCashFlow ? "PASS" : "FAIL";
    const rescueCtx: RescueContext = {
      rentMonthly: inputs.rentMonthly, expenses: inputs.expenses, targetCashFlow: inputs.targetCashFlow,
      currentCashFlow: cashFlow, currentDebtService: result.monthlyWrapPayment,
      debtRatePct: inputs.wrapTerms.wrapRatePct, debtTermYears: inputs.wrapTerms.wrapTermYears, currentDownPayment: inputs.wrapTerms.downPayment,
      wholesaleEndBuyerMaxPrice: inputs.wholesaleEndBuyerMaxPrice, currentTotalAcquisitionPrice: inputs.currentTotalAcquisitionPrice,
    };
    return {
      ...base, verdict, monthlyCashFlow: cashFlow, cashRequired: result.cashRequired,
      risk: riskFromCashFlow(cashFlow, inputs.targetCashFlow),
      reasoning: [`Wrap payment ${Math.round(result.monthlyWrapPayment)}/mo, cash flow ${Math.round(cashFlow)}/mo, ${Math.round(result.cashRequired).toLocaleString()} cash required.`, ...result.riskFlags],
      rescueOptions: verdict === "FAIL" ? computeRescueOptions(rescueCtx) : [],
    };
  }

  return { ...base, verdict: "NEEDS_INFO", monthlyCashFlow: null, cashRequired: null, risk: null, reasoning: [`${STRATEGY_LABELS[strategy]} is not yet modeled.`], rescueOptions: [] };
}
