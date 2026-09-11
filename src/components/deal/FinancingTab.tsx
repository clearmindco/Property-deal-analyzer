"use client";

import { useEffect, useState } from "react";
import type { Financing } from "@/lib/types/deal";
import { calculateHardMoneyLoan, calculateRefinance, compareLenders, type LenderComparisonResult } from "@/lib/calc";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InfoTooltip } from "@/components/ui/Tooltip";
import { useMode } from "@/lib/mode-context";
import { term, tooltipFor, TERMS } from "@/lib/terminology";
import { TabIntro } from "./TabIntro";

type TermKey = keyof typeof TERMS;

function NumField({
  termKey, label, value, onChange, mode, opts,
}: {
  termKey?: TermKey;
  label: string;
  value: number;
  onChange: (v: number) => void;
  mode: "simple" | "pro";
  opts?: { step?: number; pct?: boolean };
}) {
  const display = opts?.pct ? Math.round(value * 1000) / 10 : value;
  const shownLabel = termKey ? term(termKey, mode) : label;
  return (
    <label className="text-sm font-medium text-text-secondary">
      {shownLabel}
      {termKey && <InfoTooltip text={tooltipFor(termKey)} />}
      <input
        type="number"
        step={opts?.step ?? (opts?.pct ? 0.1 : 1)}
        value={display}
        onChange={(e) => onChange(opts?.pct ? Number(e.target.value) / 100 : Number(e.target.value))}
        className="mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm"
      />
    </label>
  );
}

function Stat({ termKey, label, value, suffix, mode }: { termKey?: TermKey; label?: string; value: string; suffix?: string; mode: "simple" | "pro" }) {
  return (
    <div>
      <span className="text-text-secondary">
        {termKey ? term(termKey, mode) : label}
        {termKey && <InfoTooltip text={tooltipFor(termKey)} />}
      </span>
      <br />
      <strong>{value}</strong>{suffix ?? ""}
    </div>
  );
}

export function FinancingTab({
  financing,
  onChange,
  onSave,
  saving,
  purchasePrice,
  rehabTotal,
  arv,
  rentMonthly,
}: {
  financing: Financing;
  onChange: (next: Financing) => void;
  onSave: () => void;
  saving: boolean;
  purchasePrice: number;
  rehabTotal: number;
  arv: number;
  rentMonthly: number;
}) {
  const { mode } = useMode();
  const hm = financing.hardMoney;
  const refi = financing.refinance;
  const exp = financing.expenses;

  const [lenderComparison, setLenderComparison] = useState<LenderComparisonResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/lenders")
      .then((res) => (res.ok ? res.json() : []))
      .then((lenders: Array<{ id: string; name: string; terms: any; verified: boolean }>) => {
        if (cancelled || purchasePrice <= 0) return;
        const result = compareLenders(purchasePrice, rehabTotal, arv, financing.holdPeriodMonths, lenders);
        setLenderComparison(result);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [purchasePrice, rehabTotal, arv, financing.holdPeriodMonths]);

  const hmResult = calculateHardMoneyLoan(purchasePrice, rehabTotal, hm, arv, financing.holdPeriodMonths);
  const refiResult = arv > 0
    ? calculateRefinance(
        arv, refi, hmResult.totalLoan,
        hmResult.cashToClose + hmResult.rehabCashRequired + hmResult.estimatedInterestDuringHold,
        rentMonthly, exp
      )
    : null;

  return (
    <div className="flex flex-col gap-6">
      <TabIntro
        blurb="This is where the hard-money loan, the refinance, and your operating expenses turn into an actual cash-flow number -- and where the Decision tab's acquisition-price engine works backward from your own requirements, never a flat rule of thumb."
        learnHref="/learn/brrrr-explained"
        learnLabel="Learn how the acquisition price is calculated"
      />
      {mode === "simple" && (
        <p className="rounded-card bg-soft-blue px-4 py-3 text-sm text-navy">
          There are two loans in a BRRRR deal: a <strong>short-term loan</strong> to buy and fix
          the property, then a <strong>long-term loan</strong> that pays off the short-term one
          and becomes your regular mortgage. Every number below has a &quot;?&quot; you can tap to explain it.
        </p>
      )}

      <Card>
        <CardTitle>
          {mode === "simple" ? "Short-term loan to buy and fix it up" : "Hard-money / rehab loan terms"}
          <InfoTooltip text="Temporary financing used to buy and renovate the property before refinancing into a permanent loan." />
        </CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NumField mode={mode} termKey="hmRate" label="Rate" value={hm.ratePct} opts={{ pct: true }} onChange={(v) => onChange({ ...financing, hardMoney: { ...hm, ratePct: v } })} />
          <NumField mode={mode} termKey="points" label="Points" value={hm.points} onChange={(v) => onChange({ ...financing, hardMoney: { ...hm, points: v } })} />
          <NumField mode={mode} termKey="purchaseFinancedPct" label="Purchase financed %" value={hm.purchaseFinancedPct} opts={{ pct: true }} onChange={(v) => onChange({ ...financing, hardMoney: { ...hm, purchaseFinancedPct: v } })} />
          <NumField mode={mode} termKey="rehabFinancedPct" label="Rehab financed %" value={hm.rehabFinancedPct} opts={{ pct: true }} onChange={(v) => onChange({ ...financing, hardMoney: { ...hm, rehabFinancedPct: v } })} />
          <NumField mode={mode} termKey="ltc" label="LTC cap %" value={hm.ltcCapPct ?? 0.9} opts={{ pct: true }} onChange={(v) => onChange({ ...financing, hardMoney: { ...hm, ltcCapPct: v } })} />
          <NumField mode={mode} termKey="arvLtv" label="ARV/LTV cap %" value={hm.arvLtvCapPct ?? 0.7} opts={{ pct: true }} onChange={(v) => onChange({ ...financing, hardMoney: { ...hm, arvLtvCapPct: v } })} />
          <NumField mode={mode} termKey="drawFee" label="Draw fee ($)" value={hm.drawFee ?? 0} onChange={(v) => onChange({ ...financing, hardMoney: { ...hm, drawFee: v } })} />
          <NumField mode={mode} termKey="appraisalFee" label="Appraisal fee ($)" value={hm.appraisalFee ?? 0} onChange={(v) => onChange({ ...financing, hardMoney: { ...hm, appraisalFee: v } })} />
          <NumField mode={mode} termKey="underwritingFee" label="Underwriting fee ($)" value={hm.underwritingFee ?? 0} onChange={(v) => onChange({ ...financing, hardMoney: { ...hm, underwritingFee: v } })} />
          <NumField mode={mode} termKey="holdPeriod" label="Hold period (months)" value={financing.holdPeriodMonths} onChange={(v) => onChange({ ...financing, holdPeriodMonths: v })} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-card bg-soft-blue p-4 text-sm sm:grid-cols-4">
          <Stat mode={mode} termKey="purchaseLoan" value={`$${Math.round(hmResult.purchaseLoan).toLocaleString()}`} />
          <Stat mode={mode} termKey="rehabLoan" value={`$${Math.round(hmResult.rehabLoan).toLocaleString()}`} />
          <Stat mode={mode} termKey="totalLoan" value={`$${Math.round(hmResult.totalLoan).toLocaleString()}`} />
          <Stat mode={mode} termKey="cashToClose" value={`$${Math.round(hmResult.cashToClose).toLocaleString()}`} />
          <Stat mode={mode} termKey="rehabCashRequired" value={`$${Math.round(hmResult.rehabCashRequired).toLocaleString()}`} />
          <Stat mode={mode} termKey="interestDuringHold" value={`$${Math.round(hmResult.estimatedInterestDuringHold).toLocaleString()}`} />
          <Stat mode={mode} termKey="maxCashExposure" value={`$${Math.round(hmResult.maxTemporaryCashExposure).toLocaleString()}`} />
          <Stat mode={mode} termKey="totalFinancingCost" value={`$${Math.round(hmResult.totalFinancingCost).toLocaleString()}`} />
        </div>
        {!hmResult.qualifies && (
          <p className="mt-2 text-sm text-danger">{hmResult.disqualifyReason}</p>
        )}
      </Card>

      <Card>
        <CardTitle>Lender comparison</CardTitle>
        <p className="mt-1 text-xs text-text-secondary">This same deal run through every lender saved on the Lenders page.</p>
        {!lenderComparison || lenderComparison.rows.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">No saved lenders yet, or no purchase price set.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary">
                  <th className="py-1">Lender</th>
                  <th>{term("totalLoan", mode)}</th>
                  <th>{term("totalFinancingCost", mode)}</th>
                  <th>Qualifies?</th>
                </tr>
              </thead>
              <tbody>
                {lenderComparison.rows.map((row) => (
                  <tr key={row.lenderId} className={`border-t border-silver/20 ${row.lenderId === lenderComparison.bestFitLenderId ? "bg-soft-blue" : ""}`}>
                    <td className="py-2 font-medium">
                      {row.lenderName}
                      {row.lenderId === lenderComparison.bestFitLenderId && <span className="ml-2 rounded-full bg-primary-blue px-2 py-0.5 text-[10px] text-white">BEST FIT</span>}
                    </td>
                    <td>${Math.round(row.loan.totalLoan).toLocaleString()}</td>
                    <td>${Math.round(row.loan.totalFinancingCost).toLocaleString()}</td>
                    <td>{row.loan.qualifies ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lenderComparison.bestFitReason && (
              <p className="mt-2 text-xs text-text-secondary">Why: {lenderComparison.bestFitReason}</p>
            )}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>{mode === "simple" ? "Long-term loan that replaces it" : "Refinance terms"}</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NumField mode={mode} termKey="refiLtv" label="Refi LTV %" value={refi.refiLtvPct} opts={{ pct: true }} onChange={(v) => onChange({ ...financing, refinance: { ...refi, refiLtvPct: v } })} />
          <NumField mode={mode} termKey="refiRate" label="Rate" value={refi.ratePct} opts={{ pct: true }} onChange={(v) => onChange({ ...financing, refinance: { ...refi, ratePct: v } })} />
          <NumField mode={mode} termKey="refiTerm" label="Term (years)" value={refi.termYears} onChange={(v) => onChange({ ...financing, refinance: { ...refi, termYears: v } })} />
          <NumField mode={mode} termKey="refiClosingCosts" label="Closing costs %" value={refi.closingCostsPct} opts={{ pct: true }} onChange={(v) => onChange({ ...financing, refinance: { ...refi, closingCostsPct: v } })} />
          <NumField mode={mode} termKey="minDscr" label="Min DSCR" value={refi.minDscr ?? 1.2} onChange={(v) => onChange({ ...financing, refinance: { ...refi, minDscr: v } })} />
        </div>

        {refiResult && (
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-card bg-soft-blue p-4 text-sm sm:grid-cols-4">
            <Stat mode={mode} termKey="refiLoanAmount" value={`$${Math.round(refiResult.refiLoanAmount).toLocaleString()}`} suffix={mode === "pro" ? ` (${refiResult.cappedBy})` : ""} />
            <Stat mode={mode} termKey="hardMoneyPayoff" value={`$${Math.round(refiResult.hardMoneyPayoff).toLocaleString()}`} />
            <Stat mode={mode} termKey="cashReturned" value={`$${Math.round(refiResult.cashReturnedToInvestor).toLocaleString()}`} />
            <Stat mode={mode} termKey="cashLeftInProperty" value={`$${Math.round(refiResult.cashRemainingInProperty).toLocaleString()}`} />
            <Stat mode={mode} termKey="monthlyPI" value={`$${Math.round(refiResult.monthlyPI).toLocaleString()}`} />
            <Stat mode={mode} termKey="cashFlow" value={`$${Math.round(refiResult.postRefiCashFlowMonthly).toLocaleString()}`} suffix="/mo" />
            <Stat mode={mode} termKey="dscr" value={refiResult.postRefiDscr.toFixed(2)} />
            <Stat mode={mode} termKey="equityAtRefi" value={`$${Math.round(refiResult.equityAtRefi).toLocaleString()}`} />
          </div>
        )}
        {!refiResult && <p className="mt-3 text-sm text-text-secondary">Add an ARV on the Value/ARV tab to see refinance math.</p>}
      </Card>

      <Card>
        <CardTitle>{mode === "simple" ? "Monthly costs of owning it" : "Operating expense assumptions"}</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NumField mode={mode} label="Annual taxes ($)" value={exp.taxesAnnual} onChange={(v) => onChange({ ...financing, expenses: { ...exp, taxesAnnual: v } })} />
          <NumField mode={mode} label="Annual insurance ($)" value={exp.insuranceAnnual} onChange={(v) => onChange({ ...financing, expenses: { ...exp, insuranceAnnual: v } })} />
          <NumField mode={mode} termKey="vacancyPct" label="Vacancy %" value={exp.vacancyPct} opts={{ pct: true }} onChange={(v) => onChange({ ...financing, expenses: { ...exp, vacancyPct: v } })} />
          <NumField mode={mode} termKey="maintenancePct" label="Maintenance %" value={exp.maintenancePct} opts={{ pct: true }} onChange={(v) => onChange({ ...financing, expenses: { ...exp, maintenancePct: v } })} />
          <NumField mode={mode} termKey="capexPct" label="CapEx %" value={exp.capexPct} opts={{ pct: true }} onChange={(v) => onChange({ ...financing, expenses: { ...exp, capexPct: v } })} />
          <NumField mode={mode} termKey="managementPct" label="Management %" value={exp.managementPct} opts={{ pct: true }} onChange={(v) => onChange({ ...financing, expenses: { ...exp, managementPct: v } })} />
        </div>
        <p className="mt-2 text-xs text-text-secondary">Management stays in the underwriting even if you plan to self-manage -- your time still has a cost.</p>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save financing assumptions"}</Button>
      </div>
    </div>
  );
}
