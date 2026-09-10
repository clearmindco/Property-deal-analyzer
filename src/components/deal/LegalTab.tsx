"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type {
  AttorneySummary, DocumentRequirement, LegalIntake, LegalTransactionType, LegalTriggerResult,
} from "@/lib/types/legal";
import { LEGAL_TRANSACTION_TYPE_LABELS } from "@/lib/types/legal";

interface LegalCaseState {
  id: string;
  transactionType: LegalTransactionType;
  status: string;
  intake: LegalIntake;
  triggerResult: LegalTriggerResult;
  requiredDocuments: DocumentRequirement[];
  attorneySummary: AttorneySummary;
}

const TRANSACTION_TYPES = Object.keys(LEGAL_TRANSACTION_TYPE_LABELS) as LegalTransactionType[];

function TriState({
  label, value, onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <span className="text-sm text-text-primary">{label}</span>
      <div className="flex gap-2">
        {([["Yes", true], ["No", false], ["Unknown", null]] as const).map(([lbl, v]) => (
          <button
            key={lbl}
            onClick={() => onChange(v)}
            className={`rounded-card border px-3 py-1 text-xs font-medium transition-colors ${
              value === v ? "border-primary-blue bg-soft-blue text-navy" : "border-silver/40 text-text-secondary hover:text-navy"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LegalTab({ dealId }: { dealId: string }) {
  const [legalCase, setLegalCase] = useState<LegalCaseState | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/deals/${dealId}/legal-case`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setLegalCase);
  }, [dealId]);

  async function start() {
    setSaving(true);
    const res = await fetch(`/api/deals/${dealId}/legal-case`, { method: "POST" });
    setLegalCase(await res.json());
    setSaving(false);
  }

  async function save(patch: { intake?: Partial<LegalIntake>; transactionType?: LegalTransactionType }) {
    if (!legalCase) return;
    setSaving(true);
    const res = await fetch(`/api/legal-cases/${legalCase.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setLegalCase(await res.json());
    setSaving(false);
  }

  if (legalCase === undefined) {
    return <Card><p className="text-sm text-text-secondary">Loading...</p></Card>;
  }

  if (legalCase === null) {
    return (
      <Card>
        <CardTitle>Legal / Smart Contract Builder</CardTitle>
        <p className="mt-2 text-sm text-text-secondary">
          Start the legal intake for this deal to route it through the New York creative-finance
          legal workflow -- pre-contract screen, distressed-property risk gate, and required
          document checklist.
        </p>
        <Button className="mt-3" onClick={start} disabled={saving}>Start legal workflow</Button>
      </Card>
    );
  }

  const { intake, triggerResult, requiredDocuments, attorneySummary, transactionType } = legalCase;

  function setIntake(patch: Partial<LegalIntake>) {
    setLegalCase((prev) => (prev ? { ...prev, intake: { ...prev.intake, ...patch } } : prev));
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-xs text-text-secondary">
          AI explains. Data supports. Math decides. Human approves. Attorney-approved language
          stays locked. Nothing on this tab is legal advice, and no document here is guaranteed
          enforceable -- every template requires attorney review before use.
        </p>
      </Card>

      {triggerResult.triggered && (
        <Card className="border-danger bg-danger/10">
          <CardTitle className="text-danger">Red legal gate -- do not generate a standard contract</CardTitle>
          <p className="mt-2 text-sm font-semibold text-danger">{triggerResult.gateMessage}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-text-primary">
            {triggerResult.triggeringFacts.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
          <p className="mt-2 text-sm text-text-primary">{triggerResult.requiredAction}</p>
        </Card>
      )}

      <Card>
        <CardTitle>Transaction type</CardTitle>
        <select
          value={transactionType}
          onChange={(e) => save({ transactionType: e.target.value as LegalTransactionType })}
          className="mt-2 w-full max-w-sm rounded-card border border-silver/40 bg-canvas px-3 py-2 text-sm"
        >
          {TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>{LEGAL_TRANSACTION_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </Card>

      <Card>
        <CardTitle>Pre-contract legal screen</CardTitle>
        <div className="mt-2 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          <div>
            <label className="text-sm text-text-primary">Occupancy</label>
            <select
              value={intake.occupancyType}
              onChange={(e) => setIntake({ occupancyType: e.target.value as LegalIntake["occupancyType"] })}
              className="mt-1 w-full rounded-card border border-silver/40 bg-canvas px-3 py-2 text-sm"
            >
              <option value="UNKNOWN">Unknown</option>
              <option value="OWNER_OCCUPIED">Owner occupied</option>
              <option value="TENANT_OCCUPIED">Tenant occupied</option>
              <option value="VACANT">Vacant</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-text-primary">Property type</label>
            <select
              value={intake.propertyType}
              onChange={(e) => setIntake({ propertyType: e.target.value as LegalIntake["propertyType"] })}
              className="mt-1 w-full rounded-card border border-silver/40 bg-canvas px-3 py-2 text-sm"
            >
              <option value="ONE_TO_FOUR_FAMILY">1-4 family</option>
              <option value="MULTIFAMILY_5_PLUS">Multifamily 5+</option>
              <option value="CONDO">Condo</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="LAND">Land</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">Distress facts (New York gate)</p>
        <TriState label="Currently in foreclosure?" value={intake.inForeclosure} onChange={(v) => setIntake({ inForeclosure: v })} />
        <TriState label="Received a notice of default?" value={intake.receivedNoticeOfDefault} onChange={(v) => setIntake({ receivedNoticeOfDefault: v })} />
        <TriState label="Received a notice of pendency (lis pendens)?" value={intake.receivedNoticeOfPendency} onChange={(v) => setIntake({ receivedNoticeOfPendency: v })} />
        <TriState label="Tax or utility lien sale scheduled?" value={intake.taxOrUtilityLienSaleScheduled} onChange={(v) => setIntake({ taxOrUtilityLienSaleScheduled: v })} />
        <TriState label="Property previously reconveyed after a foreclosure sale?" value={intake.priorForeclosureReconveyance} onChange={(v) => setIntake({ priorForeclosureReconveyance: v })} />
        <TriState label="Would seller retain possession after closing?" value={intake.sellerToRetainPossessionAfterClosing} onChange={(v) => setIntake({ sellerToRetainPossessionAfterClosing: v })} />

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">Financing facts</p>
        <label className="mt-2 flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={intake.mortgageStatementReceived}
            onChange={(e) => setIntake({ mortgageStatementReceived: e.target.checked })}
          />
          Mortgage statement received
        </label>
        <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <div>
            <label className="text-sm text-text-primary">Seller-reported monthly payment</label>
            <input
              type="number"
              value={intake.sellerReportedMonthlyPayment ?? ""}
              onChange={(e) => setIntake({ sellerReportedMonthlyPayment: e.target.value ? Number(e.target.value) : null })}
              className="mt-1 w-full rounded-card border border-silver/40 bg-canvas px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-text-primary">Verified monthly payment</label>
            <input
              type="number"
              value={intake.verifiedMonthlyPayment ?? ""}
              onChange={(e) => setIntake({ verifiedMonthlyPayment: e.target.value ? Number(e.target.value) : null })}
              className="mt-1 w-full rounded-card border border-silver/40 bg-canvas px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-text-primary">Seller-reported loan balance</label>
            <input
              type="number"
              value={intake.sellerReportedLoanBalance ?? ""}
              onChange={(e) => setIntake({ sellerReportedLoanBalance: e.target.value ? Number(e.target.value) : null })}
              className="mt-1 w-full rounded-card border border-silver/40 bg-canvas px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-text-primary">Verified loan balance</label>
            <input
              type="number"
              value={intake.verifiedLoanBalance ?? ""}
              onChange={(e) => setIntake({ verifiedLoanBalance: e.target.value ? Number(e.target.value) : null })}
              className="mt-1 w-full rounded-card border border-silver/40 bg-canvas px-3 py-2 text-sm"
            />
          </div>
        </div>

        <Button className="mt-4" onClick={() => save({ intake })} disabled={saving}>
          {saving ? "Saving..." : "Save legal screen"}
        </Button>
      </Card>

      <Card>
        <CardTitle>Required document checklist</CardTitle>
        <ul className="mt-2 flex flex-col gap-2">
          {requiredDocuments.map((doc) => (
            <li key={doc.key} className="rounded-card border border-silver/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-navy">{doc.label}</span>
                {doc.attorneyReviewRequired && (
                  <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">Attorney review required</span>
                )}
              </div>
              <p className="mt-1 text-xs text-text-secondary">{doc.reason}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>Attorney intake summary</CardTitle>
        <p className="mt-2 text-sm font-semibold text-navy">{attorneySummary.headline}</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-text-secondary">Property facts</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-text-primary">
              {attorneySummary.propertyFacts.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-text-secondary">Trigger flags</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-text-primary">
              {attorneySummary.triggerFlags.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-text-secondary">Financing</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-text-primary">
              {attorneySummary.financingSummary.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-text-secondary">Open questions</p>
            {attorneySummary.openQuestions.length === 0 ? (
              <p className="mt-1 text-sm text-text-secondary">None.</p>
            ) : (
              <ul className="mt-1 list-disc pl-5 text-sm text-text-primary">
                {attorneySummary.openQuestions.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            )}
          </div>
        </div>
        <p className="mt-4 text-xs italic text-text-secondary">{attorneySummary.disclaimer}</p>
      </Card>
    </div>
  );
}
