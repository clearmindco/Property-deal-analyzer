"use client";

import { useMemo, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { TabIntro } from "./TabIntro";
import type {
  CreativeFinance, HardMoneyTerms, InvestorRequirements, OperatingExpenseAssumptions, RefinanceTerms,
} from "@/lib/types/deal";
import type { ContractControlFacts, StrategyResult } from "@/lib/types/strategy";
import { STRATEGY_LABELS } from "@/lib/types/strategy";
import { evaluateAllStrategies } from "@/lib/strategy/strategyFeasibility";
import { rankStrategies } from "@/lib/strategy/bestDealRouter";
import type { DscrRentalTerms } from "@/lib/calc/dscrRental";
import type { WrapTerms } from "@/lib/calc/wrapFinancing";

function money(n: number | null): string {
  if (n === null) return "--";
  return `$${Math.round(n).toLocaleString()}`;
}

const AVAILABILITY_STYLES = {
  available: "bg-success/15 text-success",
  unavailable: "bg-silver/30 text-text-secondary",
};

const VERDICT_STYLES: Record<string, string> = {
  PASS: "bg-success/15 text-success",
  FAIL: "bg-danger/10 text-danger",
  NEEDS_INFO: "bg-warning/15 text-warning",
};

function StrategyCard({ result }: { result: StrategyResult }) {
  return (
    <div className="rounded-card border border-silver/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-navy">{STRATEGY_LABELS[result.strategy]}</p>
        <div className="flex gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${result.available ? AVAILABILITY_STYLES.available : AVAILABILITY_STYLES.unavailable}`}>
            {result.available ? "Available" : "Not available"}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${VERDICT_STYLES[result.verdict]}`}>
            {result.verdict.replace("_", " ")}
          </span>
        </div>
      </div>
      <p className="mt-1 text-xs text-text-secondary">{result.availabilityReason}</p>

      {result.available && (result.monthlyCashFlow !== null || result.cashRequired !== null) && (
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <dt className="text-text-secondary">Monthly cash flow</dt>
          <dd className={`text-right font-medium ${result.monthlyCashFlow !== null && result.monthlyCashFlow < 0 ? "text-danger" : "text-success"}`}>
            {money(result.monthlyCashFlow)}
          </dd>
          <dt className="text-text-secondary">Cash required</dt>
          <dd className="text-right font-medium">{money(result.cashRequired)}</dd>
          {result.risk && (<><dt className="text-text-secondary">Risk</dt><dd className="text-right font-medium">{result.risk}</dd></>)}
        </dl>
      )}

      {result.reasoning.length > 0 && (
        <ul className="mt-2 list-disc pl-5 text-xs text-text-secondary">
          {result.reasoning.map((r, i) => <li key={i} className="py-0.5">{r}</li>)}
        </ul>
      )}

      {result.rescueOptions.length > 0 && (
        <div className="mt-2 rounded-card bg-soft-blue/40 p-3">
          <p className="text-xs font-semibold uppercase text-navy">Can we rescue this?</p>
          <ul className="mt-1 flex flex-col gap-1">
            {result.rescueOptions.map((o, i) => (
              <li key={i} className="text-xs text-text-primary"><strong>{o.label}:</strong> {o.description}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function StrategyRouterTab({
  arv, rehabTotal, rentMonthly, expenses, askingPrice, hardMoneyTerms, refinanceTerms, holdPeriodMonths,
  requirements, creativeFinance, contractControl, currentTotalAcquisitionPrice,
}: {
  arv: number;
  rehabTotal: number;
  rentMonthly: number;
  expenses: OperatingExpenseAssumptions;
  askingPrice: number | undefined;
  hardMoneyTerms: HardMoneyTerms;
  refinanceTerms: RefinanceTerms;
  holdPeriodMonths: number;
  requirements: InvestorRequirements;
  creativeFinance: CreativeFinance;
  contractControl: ContractControlFacts;
  currentTotalAcquisitionPrice: number | undefined;
}) {
  const [targetCashFlow, setTargetCashFlow] = useState(String(requirements.minMonthlyCashFlowPerDoor || 200));
  const [wholesaleEndBuyerMaxPrice, setWholesaleEndBuyerMaxPrice] = useState("");

  const [dscrEnabled, setDscrEnabled] = useState(false);
  const [dscr, setDscr] = useState({ downPaymentPct: "25", ratePct: "7.5", termYears: "30", closingCostsPct: "3" });
  const dscrTerms: DscrRentalTerms | undefined = useMemo(() => (dscrEnabled && askingPrice ? {
    purchasePrice: askingPrice,
    downPaymentPct: Number(dscr.downPaymentPct) / 100,
    ratePct: Number(dscr.ratePct) / 100,
    termYears: Number(dscr.termYears),
    closingCostsPct: Number(dscr.closingCostsPct) / 100,
  } : undefined), [dscrEnabled, askingPrice, dscr]);

  const [wrapEnabled, setWrapEnabled] = useState(false);
  const [wrap, setWrap] = useState({ downPayment: "", wrapRatePct: "7", wrapTermYears: "30" });
  const wrapTerms: WrapTerms | undefined = useMemo(() => (wrapEnabled && askingPrice ? {
    purchasePrice: askingPrice,
    downPayment: Number(wrap.downPayment) || 0,
    wrapRatePct: Number(wrap.wrapRatePct) / 100,
    wrapTermYears: Number(wrap.wrapTermYears),
    existingLoanBalance: creativeFinance.subjectTo?.existingLoan.balance,
    existingLoanPayment: creativeFinance.subjectTo?.existingLoan.monthlyPayment,
  } : undefined), [wrapEnabled, askingPrice, wrap, creativeFinance.subjectTo]);

  const results = useMemo(() => evaluateAllStrategies({
    arv, rehabTotal, rentMonthly, expenses, askingPrice, hardMoneyTerms, refinanceTerms, holdPeriodMonths,
    requirements, creativeFinance, contractControl, dscrTerms, wrapTerms,
    targetCashFlow: Number(targetCashFlow) || 0,
    currentTotalAcquisitionPrice,
    wholesaleEndBuyerMaxPrice: wholesaleEndBuyerMaxPrice ? Number(wholesaleEndBuyerMaxPrice) : undefined,
  }), [
    arv, rehabTotal, rentMonthly, expenses, askingPrice, hardMoneyTerms, refinanceTerms, holdPeriodMonths,
    requirements, creativeFinance, contractControl, dscrTerms, wrapTerms, targetCashFlow,
    currentTotalAcquisitionPrice, wholesaleEndBuyerMaxPrice,
  ]);

  const router = useMemo(() => rankStrategies(results), [results]);
  const inputClass = "mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm";

  return (
    <div className="flex flex-col gap-4">
      <TabIntro
        blurb="Tests every legitimate acquisition and exit structure on this property -- never assumed from where the lead came from. A wholesaler-sourced deal is evaluated for cash and BRRRR exactly like a direct-seller deal; seller financing, subject-to, a wrap, hybrid, or a lease option only show as available once the underlying seller's authority is actually confirmed."
      />

      <Card>
        <CardTitle>Target</CardTitle>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm text-text-secondary">
            Target monthly cash flow
            <input type="number" value={targetCashFlow} onChange={(e) => setTargetCashFlow(e.target.value)} className={inputClass} />
          </label>
          <label className="text-sm text-text-secondary">
            Known end-buyer max price (optional, for the wholesale rescue lever)
            <input type="number" value={wholesaleEndBuyerMaxPrice} onChange={(e) => setWholesaleEndBuyerMaxPrice(e.target.value)} className={inputClass} />
          </label>
        </div>
      </Card>

      <Card>
        <CardTitle>Optional terms to evaluate</CardTitle>
        <p className="mt-1 text-xs text-text-secondary">
          Cash, BRRRR, and any seller-finance/subject-to/hybrid terms already entered on the Financing and Creative
          Finance tabs are evaluated automatically. Fill these in only if you want DSCR or Wrap tested too.
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 rounded-card border border-silver/30 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-navy">
              <input type="checkbox" checked={dscrEnabled} onChange={(e) => setDscrEnabled(e.target.checked)} />
              Evaluate DSCR / conventional rental
            </label>
            {dscrEnabled && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-xs text-text-secondary">Down %<input type="number" value={dscr.downPaymentPct} onChange={(e) => setDscr((d) => ({ ...d, downPaymentPct: e.target.value }))} className={inputClass} /></label>
                <label className="text-xs text-text-secondary">Rate %<input type="number" value={dscr.ratePct} onChange={(e) => setDscr((d) => ({ ...d, ratePct: e.target.value }))} className={inputClass} /></label>
                <label className="text-xs text-text-secondary">Term (yrs)<input type="number" value={dscr.termYears} onChange={(e) => setDscr((d) => ({ ...d, termYears: e.target.value }))} className={inputClass} /></label>
                <label className="text-xs text-text-secondary">Closing %<input type="number" value={dscr.closingCostsPct} onChange={(e) => setDscr((d) => ({ ...d, closingCostsPct: e.target.value }))} className={inputClass} /></label>
              </div>
            )}
          </div>
          <div className="flex-1 rounded-card border border-silver/30 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-navy">
              <input type="checkbox" checked={wrapEnabled} onChange={(e) => setWrapEnabled(e.target.checked)} />
              Evaluate wrap financing
            </label>
            {wrapEnabled && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-xs text-text-secondary">Down payment<input type="number" value={wrap.downPayment} onChange={(e) => setWrap((w) => ({ ...w, downPayment: e.target.value }))} className={inputClass} /></label>
                <label className="text-xs text-text-secondary">Wrap rate %<input type="number" value={wrap.wrapRatePct} onChange={(e) => setWrap((w) => ({ ...w, wrapRatePct: e.target.value }))} className={inputClass} /></label>
                <label className="text-xs text-text-secondary">Wrap term (yrs)<input type="number" value={wrap.wrapTermYears} onChange={(e) => setWrap((w) => ({ ...w, wrapTermYears: e.target.value }))} className={inputClass} /></label>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Every strategy tested</CardTitle>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {results.map((r) => <StrategyCard key={r.strategy} result={r} />)}
        </div>
      </Card>

      <Card className="border-primary-blue/40 bg-soft-blue/30">
        <CardTitle>Best Deal Router</CardTitle>
        <div className="mt-2 flex flex-col gap-2 text-sm">
          <p><strong>Recommended:</strong> {router.recommended ? STRATEGY_LABELS[router.recommended.strategy] : "None -- no strategy currently meets your target."}</p>
          <p><strong>Backup:</strong> {router.backup ? STRATEGY_LABELS[router.backup.strategy] : "None"}</p>
          <p><strong>Alternative exit:</strong> {router.alternativeExit ? STRATEGY_LABELS[router.alternativeExit.strategy] : "Not available"}</p>
          <p><strong>Walk-away point:</strong> {router.walkAwayPoint}</p>
          {router.nextInformationNeeded.length > 0 && (
            <div>
              <p className="font-semibold">Next information needed:</p>
              <ul className="list-disc pl-5">
                {router.nextInformationNeeded.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
