"use client";

import { useMemo, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { CreativeFinance, OperatingExpenseAssumptions } from "@/lib/types/deal";
import { analyzeHybrid, analyzeSellerFinance, analyzeSubjectTo, recommendExitStrategy, type CreativeFinanceScenarioResult } from "@/lib/calc/creativeFinance";
import { TabIntro } from "./TabIntro";

function money(n: number | null | undefined): string {
  if (n === null || n === undefined) return "--";
  return `$${Math.round(n).toLocaleString()}`;
}

function Field({
  label, value, onChange, step = 1,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  step?: number;
}) {
  return (
    <label className="text-sm text-text-primary">
      {label}
      <input
        type="number"
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="mt-1 w-full rounded-card border border-silver/40 bg-canvas px-3 py-2 text-sm"
      />
    </label>
  );
}

function ScenarioCard({ result }: { result: CreativeFinanceScenarioResult }) {
  return (
    <div className="rounded-card border border-silver/30 p-4">
      <p className="text-sm font-semibold text-navy">{result.label}</p>
      {!result.applicable ? (
        <p className="mt-2 text-sm text-text-secondary">{result.blockedReason}</p>
      ) : (
        <>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <dt className="text-text-secondary">Monthly debt service</dt><dd className="text-right font-medium">{money(result.monthlyDebtService)}</dd>
            <dt className="text-text-secondary">Monthly cash flow</dt>
            <dd className={`text-right font-medium ${result.cashFlow && result.cashFlow.netMonthlyCashFlow < 0 ? "text-danger" : "text-success"}`}>
              {money(result.cashFlow?.netMonthlyCashFlow)}
            </dd>
            <dt className="text-text-secondary">Cash to close</dt><dd className="text-right font-medium">{money(result.cashToClose)}</dd>
            <dt className="text-text-secondary">Cash-on-cash return</dt>
            <dd className="text-right font-medium">{result.cashOnCashReturn === null ? "n/a (little cash invested)" : `${(result.cashOnCashReturn * 100).toFixed(1)}%`}</dd>
            <dt className="text-text-secondary">Equity captured at close</dt><dd className="text-right font-medium">{money(result.equityCaptured)}</dd>
          </dl>
          {result.assumptionNotes.map((n, i) => (
            <p key={i} className="mt-2 text-xs italic text-text-secondary">{n}</p>
          ))}
          <ul className="mt-2 flex flex-col gap-1">
            {result.riskFlags.map((f, i) => (
              <li key={i} className="rounded-card bg-warning/10 px-2 py-1 text-xs text-warning">{f}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function CreativeFinanceTab({
  creativeFinance, onChange, onSave, saving, arv, rentMonthly, expenses, cashBrrrMonthlyCashFlow, cashBrrrCashToClose,
}: {
  creativeFinance: CreativeFinance;
  onChange: (cf: CreativeFinance) => void;
  onSave: () => void;
  saving: boolean;
  arv: number;
  rentMonthly: number;
  expenses: OperatingExpenseAssumptions;
  cashBrrrMonthlyCashFlow: number | null;
  cashBrrrCashToClose: number | null;
}) {
  const [cf, setCf] = useState<CreativeFinance>(creativeFinance);

  function patch(next: CreativeFinance) {
    setCf(next);
    onChange(next);
  }

  const subjectTo = useMemo(() => analyzeSubjectTo(cf.subjectTo, arv, rentMonthly, expenses), [cf.subjectTo, arv, rentMonthly, expenses]);
  const sellerFinance = useMemo(() => analyzeSellerFinance(cf.sellerFinance, arv, rentMonthly, expenses), [cf.sellerFinance, arv, rentMonthly, expenses]);
  const hybrid = useMemo(() => analyzeHybrid(cf.hybrid, arv, rentMonthly, expenses), [cf.hybrid, arv, rentMonthly, expenses]);
  const exitStrategy = useMemo(() => recommendExitStrategy([subjectTo, sellerFinance, hybrid]), [subjectTo, sellerFinance, hybrid]);

  return (
    <div className="flex flex-col gap-4">
      <TabIntro
        blurb="Models the numbers for a seller-finance, subject-to, or hybrid structure side by side with your Cash/BRRRR plan from the Financing tab. This is math only -- it never tells you whether a structure is legal in your state or safe to sign. Use the Legal tab before presenting any of this to a seller."
        learnHref="/learn/creative-finance-basics"
        learnLabel="Learn what each structure actually means"
      />

      <Card>
        <CardTitle>Subject-to: existing loan</CardTitle>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Existing loan balance" value={cf.subjectTo?.existingLoan.balance} onChange={(v) => patch({ ...cf, subjectTo: { ...cf.subjectTo, existingLoan: { ...cf.subjectTo?.existingLoan, balance: v } } })} />
          <Field label="Existing monthly payment (PITI)" value={cf.subjectTo?.existingLoan.monthlyPayment} onChange={(v) => patch({ ...cf, subjectTo: { ...cf.subjectTo, existingLoan: { ...cf.subjectTo?.existingLoan, monthlyPayment: v } } })} />
          <Field label="Interest rate (used only if payment unknown)" step={0.001} value={cf.subjectTo?.existingLoan.interestRatePct} onChange={(v) => patch({ ...cf, subjectTo: { ...cf.subjectTo, existingLoan: { ...cf.subjectTo?.existingLoan, interestRatePct: v } } })} />
          <Field label="Cash to seller at closing" value={cf.subjectTo?.cashToSeller} onChange={(v) => patch({ ...cf, subjectTo: { ...cf.subjectTo, existingLoan: cf.subjectTo?.existingLoan ?? {}, cashToSeller: v } })} />
          <Field label="Arrears to cover at closing" value={cf.subjectTo?.arrearsToCoverAtClosing} onChange={(v) => patch({ ...cf, subjectTo: { ...cf.subjectTo, existingLoan: cf.subjectTo?.existingLoan ?? {}, arrearsToCoverAtClosing: v } })} />
          <Field label="Closing costs" value={cf.subjectTo?.closingCosts} onChange={(v) => patch({ ...cf, subjectTo: { ...cf.subjectTo, existingLoan: cf.subjectTo?.existingLoan ?? {}, closingCosts: v } })} />
        </div>
      </Card>

      <Card>
        <CardTitle>Seller finance: note terms</CardTitle>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Purchase price" value={cf.sellerFinance?.purchasePrice} onChange={(v) => patch({ ...cf, sellerFinance: { ...cf.sellerFinance, purchasePrice: v } })} />
          <Field label="Down payment" value={cf.sellerFinance?.downPayment} onChange={(v) => patch({ ...cf, sellerFinance: { ...cf.sellerFinance, downPayment: v } })} />
          <Field label="Note rate (decimal, e.g. 0.07)" step={0.001} value={cf.sellerFinance?.noteRatePct} onChange={(v) => patch({ ...cf, sellerFinance: { ...cf.sellerFinance, noteRatePct: v } })} />
          <Field label="Note term (years)" value={cf.sellerFinance?.noteTermYears} onChange={(v) => patch({ ...cf, sellerFinance: { ...cf.sellerFinance, noteTermYears: v } })} />
          <Field label="Balloon due (months, 0 = none)" value={cf.sellerFinance?.balloonMonths} onChange={(v) => patch({ ...cf, sellerFinance: { ...cf.sellerFinance, balloonMonths: v } })} />
          <Field label="Closing costs" value={cf.sellerFinance?.closingCosts} onChange={(v) => patch({ ...cf, sellerFinance: { ...cf.sellerFinance, closingCosts: v } })} />
        </div>
      </Card>

      <Card>
        <CardTitle>Hybrid: existing loan + seller carry</CardTitle>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Existing loan balance" value={cf.hybrid?.existingLoan.balance} onChange={(v) => patch({ ...cf, hybrid: { ...cf.hybrid, existingLoan: { ...cf.hybrid?.existingLoan, balance: v }, sellerCarryAmount: cf.hybrid?.sellerCarryAmount } })} />
          <Field label="Existing monthly payment" value={cf.hybrid?.existingLoan.monthlyPayment} onChange={(v) => patch({ ...cf, hybrid: { ...cf.hybrid, existingLoan: { ...cf.hybrid?.existingLoan, monthlyPayment: v }, sellerCarryAmount: cf.hybrid?.sellerCarryAmount } })} />
          <Field label="Seller carry amount" value={cf.hybrid?.sellerCarryAmount} onChange={(v) => patch({ ...cf, hybrid: { ...cf.hybrid, existingLoan: cf.hybrid?.existingLoan ?? {}, sellerCarryAmount: v } })} />
          <Field label="Seller carry rate (decimal)" step={0.001} value={cf.hybrid?.sellerCarryRatePct} onChange={(v) => patch({ ...cf, hybrid: { ...cf.hybrid, existingLoan: cf.hybrid?.existingLoan ?? {}, sellerCarryRatePct: v } })} />
          <Field label="Seller carry term (years)" value={cf.hybrid?.sellerCarryTermYears} onChange={(v) => patch({ ...cf, hybrid: { ...cf.hybrid, existingLoan: cf.hybrid?.existingLoan ?? {}, sellerCarryTermYears: v } })} />
          <Field label="Cash to seller at closing" value={cf.hybrid?.cashToSeller} onChange={(v) => patch({ ...cf, hybrid: { ...cf.hybrid, existingLoan: cf.hybrid?.existingLoan ?? {}, cashToSeller: v } })} />
        </div>
        <Button className="mt-4" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save creative-finance terms"}</Button>
      </Card>

      <Card>
        <CardTitle>Side-by-side comparison</CardTitle>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-card border border-silver/30 p-4">
            <p className="text-sm font-semibold text-navy">Cash / BRRRR (from Financing tab)</p>
            {cashBrrrMonthlyCashFlow === null ? (
              <p className="mt-2 text-sm text-text-secondary">Enter ARV, rent, and financing terms to see this.</p>
            ) : (
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <dt className="text-text-secondary">Post-refi monthly cash flow</dt>
                <dd className={`text-right font-medium ${cashBrrrMonthlyCashFlow < 0 ? "text-danger" : "text-success"}`}>{money(cashBrrrMonthlyCashFlow)}</dd>
                <dt className="text-text-secondary">Cash left in property</dt><dd className="text-right font-medium">{money(cashBrrrCashToClose)}</dd>
              </dl>
            )}
          </div>
          <ScenarioCard result={subjectTo} />
          <ScenarioCard result={sellerFinance} />
          <ScenarioCard result={hybrid} />
        </div>
      </Card>

      <Card>
        <CardTitle>Exit-strategy suggestion</CardTitle>
        <p className="mt-2 text-sm font-semibold text-navy">
          {exitStrategy.recommendedLabel ? `Best fit among what you've entered: ${exitStrategy.recommendedLabel}` : "No modeled structure cash flows yet"}
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-text-primary">
          {exitStrategy.reasoning.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </Card>
    </div>
  );
}
