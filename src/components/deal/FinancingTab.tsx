"use client";

import { useEffect, useState } from "react";
import type { Financing } from "@/lib/types/deal";
import { calculateHardMoneyLoan, calculateRefinance, compareLenders, type LenderComparisonResult } from "@/lib/calc";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InfoTooltip } from "@/components/ui/Tooltip";

function numInput(label: string, value: number, onChange: (v: number) => void, opts?: { step?: number; pct?: boolean }) {
  const display = opts?.pct ? Math.round(value * 1000) / 10 : value;
  return (
    <label className="text-sm font-medium text-text-secondary">
      {label}
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
      <Card>
        <CardTitle>
          Hard-money / rehab loan terms
          <InfoTooltip text="Temporary financing used to buy and renovate the property before refinancing into a permanent loan." />
        </CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {numInput("Rate", hm.ratePct, (v) => onChange({ ...financing, hardMoney: { ...hm, ratePct: v } }), { pct: true })}
          {numInput("Points", hm.points, (v) => onChange({ ...financing, hardMoney: { ...hm, points: v } }))}
          {numInput("Purchase financed %", hm.purchaseFinancedPct, (v) => onChange({ ...financing, hardMoney: { ...hm, purchaseFinancedPct: v } }), { pct: true })}
          {numInput("Rehab financed %", hm.rehabFinancedPct, (v) => onChange({ ...financing, hardMoney: { ...hm, rehabFinancedPct: v } }), { pct: true })}
          {numInput("LTC cap %", hm.ltcCapPct ?? 0.9, (v) => onChange({ ...financing, hardMoney: { ...hm, ltcCapPct: v } }), { pct: true })}
          {numInput("ARV/LTV cap %", hm.arvLtvCapPct ?? 0.7, (v) => onChange({ ...financing, hardMoney: { ...hm, arvLtvCapPct: v } }), { pct: true })}
          {numInput("Draw fee ($)", hm.drawFee ?? 0, (v) => onChange({ ...financing, hardMoney: { ...hm, drawFee: v } }))}
          {numInput("Appraisal fee ($)", hm.appraisalFee ?? 0, (v) => onChange({ ...financing, hardMoney: { ...hm, appraisalFee: v } }))}
          {numInput("Underwriting fee ($)", hm.underwritingFee ?? 0, (v) => onChange({ ...financing, hardMoney: { ...hm, underwritingFee: v } }))}
          {numInput("Hold period (months)", financing.holdPeriodMonths, (v) => onChange({ ...financing, holdPeriodMonths: v }))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-card bg-soft-blue p-4 text-sm sm:grid-cols-4">
          <div>Purchase loan<br /><strong>${Math.round(hmResult.purchaseLoan).toLocaleString()}</strong></div>
          <div>Rehab loan<br /><strong>${Math.round(hmResult.rehabLoan).toLocaleString()}</strong></div>
          <div>Total loan<br /><strong>${Math.round(hmResult.totalLoan).toLocaleString()}</strong></div>
          <div>Cash to close<br /><strong>${Math.round(hmResult.cashToClose).toLocaleString()}</strong></div>
          <div>Rehab cash required<br /><strong>${Math.round(hmResult.rehabCashRequired).toLocaleString()}</strong></div>
          <div>Est. interest during hold<br /><strong>${Math.round(hmResult.estimatedInterestDuringHold).toLocaleString()}</strong></div>
          <div>Max temporary cash exposure<br /><strong>${Math.round(hmResult.maxTemporaryCashExposure).toLocaleString()}</strong></div>
          <div>Total financing cost<br /><strong>${Math.round(hmResult.totalFinancingCost).toLocaleString()}</strong></div>
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
                  <th>Total loan</th>
                  <th>Total financing cost</th>
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
        <CardTitle>Refinance terms</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {numInput("Refi LTV %", refi.refiLtvPct, (v) => onChange({ ...financing, refinance: { ...refi, refiLtvPct: v } }), { pct: true })}
          {numInput("Rate", refi.ratePct, (v) => onChange({ ...financing, refinance: { ...refi, ratePct: v } }), { pct: true })}
          {numInput("Term (years)", refi.termYears, (v) => onChange({ ...financing, refinance: { ...refi, termYears: v } }))}
          {numInput("Closing costs %", refi.closingCostsPct, (v) => onChange({ ...financing, refinance: { ...refi, closingCostsPct: v } }), { pct: true })}
          {numInput("Min DSCR", refi.minDscr ?? 1.2, (v) => onChange({ ...financing, refinance: { ...refi, minDscr: v } }))}
        </div>

        {refiResult && (
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-card bg-soft-blue p-4 text-sm sm:grid-cols-4">
            <div>Refi loan amount<br /><strong>${Math.round(refiResult.refiLoanAmount).toLocaleString()}</strong> ({refiResult.cappedBy})</div>
            <div>Payoff (hard money)<br /><strong>${Math.round(refiResult.hardMoneyPayoff).toLocaleString()}</strong></div>
            <div>Cash returned<br /><strong>${Math.round(refiResult.cashReturnedToInvestor).toLocaleString()}</strong></div>
            <div>Cash left in property<br /><strong>${Math.round(refiResult.cashRemainingInProperty).toLocaleString()}</strong></div>
            <div>Monthly P&amp;I<br /><strong>${Math.round(refiResult.monthlyPI).toLocaleString()}</strong></div>
            <div>Post-refi cash flow<br /><strong>${Math.round(refiResult.postRefiCashFlowMonthly).toLocaleString()}</strong>/mo</div>
            <div>Post-refi DSCR<br /><strong>{refiResult.postRefiDscr.toFixed(2)}</strong></div>
            <div>Equity at refi<br /><strong>${Math.round(refiResult.equityAtRefi).toLocaleString()}</strong></div>
          </div>
        )}
        {!refiResult && <p className="mt-3 text-sm text-text-secondary">Add an ARV on the Value/ARV tab to see refinance math.</p>}
      </Card>

      <Card>
        <CardTitle>Operating expense assumptions</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {numInput("Annual taxes ($)", exp.taxesAnnual, (v) => onChange({ ...financing, expenses: { ...exp, taxesAnnual: v } }))}
          {numInput("Annual insurance ($)", exp.insuranceAnnual, (v) => onChange({ ...financing, expenses: { ...exp, insuranceAnnual: v } }))}
          {numInput("Vacancy %", exp.vacancyPct, (v) => onChange({ ...financing, expenses: { ...exp, vacancyPct: v } }), { pct: true })}
          {numInput("Maintenance %", exp.maintenancePct, (v) => onChange({ ...financing, expenses: { ...exp, maintenancePct: v } }), { pct: true })}
          {numInput("CapEx %", exp.capexPct, (v) => onChange({ ...financing, expenses: { ...exp, capexPct: v } }), { pct: true })}
          {numInput("Management %", exp.managementPct, (v) => onChange({ ...financing, expenses: { ...exp, managementPct: v } }), { pct: true })}
        </div>
        <p className="mt-2 text-xs text-text-secondary">Management stays in the underwriting even if you plan to self-manage (spec section 20).</p>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save financing assumptions"}</Button>
      </div>
    </div>
  );
}
