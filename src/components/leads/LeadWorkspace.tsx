"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { getAiProvider } from "@/lib/ai/provider";
import type { SellerMessageAnalysis } from "@/lib/ai/types";
import { computeLeadPriority, draftFollowUpMessage } from "@/lib/leadgen";
import { QUALIFICATION_FIELDS, type QualificationAnswer, type QualificationKey } from "@/lib/types/leadgen";

const STATUSES = [
  "NEW", "TALKING", "QUALIFIED", "CALL_SCHEDULED", "ANALYZING", "OFFER",
  "FOLLOW_UP", "UNDER_CONTRACT", "CLOSED", "DEAD",
] as const;

const PRIORITY_STYLES: Record<string, string> = {
  STRONG: "bg-success/15 text-success",
  MODERATE: "bg-warning/15 text-warning",
  UNCLEAR: "bg-slate/15 text-slate",
};

interface LeadRecord {
  id: string;
  sellerName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  notes: string | null;
  dealId: string | null;
  qualification: QualificationAnswer[] | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
}

function labelFor(key: QualificationKey): string {
  return QUALIFICATION_FIELDS.find((f) => f.key === key)?.label ?? key;
}

export function LeadWorkspace({
  lead: initialLead, groupName, marketName,
}: {
  lead: LeadRecord;
  groupName: string | null;
  marketName: string | null;
}) {
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [qualification, setQualification] = useState<QualificationAnswer[]>(initialLead.qualification ?? []);
  const [sellerMessage, setSellerMessage] = useState("");
  const [analysis, setAnalysis] = useState<SellerMessageAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftFollowUp, setDraftFollowUp] = useState<string | null>(null);
  const [handingOff, setHandingOff] = useState(false);

  const priority = useMemo(() => computeLeadPriority(qualification), [qualification]);
  const answeredCount = qualification.filter((q) => q.confirmed && q.value.trim()).length;
  const nextField = QUALIFICATION_FIELDS.find(
    (f) => !qualification.some((q) => q.key === f.key && q.confirmed && q.value.trim())
  );
  // Derived live from current qualification state (not frozen from the last "Analyze" call),
  // so confirming a suggested answer immediately shows up here.
  const currentlyKnown = useMemo(
    () => qualification.filter((q) => q.confirmed && q.value.trim()).map((q) => `${labelFor(q.key)}: ${q.value}`),
    [qualification]
  );
  const currentlyMissing = useMemo(
    () => QUALIFICATION_FIELDS.filter((f) => !qualification.some((q) => q.key === f.key && q.confirmed && q.value.trim())).map((f) => f.label),
    [qualification]
  );

  async function patch(fields: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    setSaving(false);
    if (res.ok) setLead(await res.json());
  }

  function updateAnswer(key: QualificationKey, value: string) {
    setQualification((prev) => {
      const existing = prev.find((q) => q.key === key);
      if (existing) return prev.map((q) => (q.key === key ? { ...q, value, confirmed: true, source: "manual" } : q));
      return [...prev, { key, value, confirmed: true, source: "manual" }];
    });
  }

  async function saveQualification() {
    await patch({ qualification, priorityLevel: priority.level, priorityReasons: priority.reasons });
  }

  async function analyzeMessage() {
    if (!sellerMessage.trim()) return;
    setAnalyzing(true);
    const existing = qualification.map((q) => ({ key: q.key, label: labelFor(q.key), value: q.value, confirmed: q.confirmed }));
    const result = await getAiProvider().analyzeSellerMessage(sellerMessage, existing);
    setAnalysis(result);
    setAnalyzing(false);
  }

  function confirmSuggested(field: string, value: string | number | boolean) {
    setQualification((prev) => {
      const key = field as QualificationKey;
      const existing = prev.find((q) => q.key === key);
      const entry: QualificationAnswer = { key, value: String(value), confirmed: true, source: "seller_message" };
      return existing ? prev.map((q) => (q.key === key ? entry : q)) : [...prev, entry];
    });
    setAnalysis((a) => (a ? { ...a, extractedAnswers: a.extractedAnswers.filter((e) => e.field !== field) } : a));
  }

  async function handoff() {
    setHandingOff(true);
    const res = await fetch(`/api/leads/${lead.id}/handoff`, { method: "POST" });
    setHandingOff(false);
    if (res.ok) {
      const { dealId } = await res.json();
      router.push(`/deals/${dealId}`);
    }
  }

  function generateFollowUp() {
    setDraftFollowUp(draftFollowUpMessage(lead.sellerName, lead.address ?? undefined, nextField?.label));
  }

  async function markContacted() {
    await patch({ lastContactAt: new Date().toISOString() });
    setDraftFollowUp(null);
  }

  const inputClass = "mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/leads" className="text-sm text-primary-blue">&larr; All leads</Link>
          <h1 className="mt-1 text-2xl font-bold text-navy">{lead.sellerName}</h1>
          {(groupName || marketName) && (
            <p className="text-sm text-text-secondary">
              Source: {marketName ?? ""}{groupName ? ` -- ${groupName}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {priority.level && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_STYLES[priority.level]}`}>
              {priority.level} OPPORTUNITY
            </span>
          )}
          <select
            value={lead.status}
            onChange={(e) => patch({ status: e.target.value })}
            className="rounded-card border border-silver/40 bg-canvas px-2 py-1 text-sm"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
      </div>

      {priority.reasons.length > 0 && (
        <Card>
          <CardTitle>Why this priority -- not a hidden score</CardTitle>
          <ul className="mt-2 list-disc pl-5 text-sm text-text-primary">
            {priority.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </Card>
      )}

      <Card>
        <CardTitle>Contact info</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="text-sm text-text-secondary">Seller name
            <input defaultValue={lead.sellerName} onBlur={(e) => patch({ sellerName: e.target.value })} className={inputClass} />
          </label>
          <label className="text-sm text-text-secondary">Address
            <input defaultValue={lead.address ?? ""} onBlur={(e) => patch({ address: e.target.value })} className={inputClass} />
          </label>
          <label className="text-sm text-text-secondary">Phone
            <input defaultValue={lead.phone ?? ""} onBlur={(e) => patch({ phone: e.target.value })} className={inputClass} />
          </label>
          <label className="text-sm text-text-secondary">Email
            <input defaultValue={lead.email ?? ""} onBlur={(e) => patch({ email: e.target.value })} className={inputClass} />
          </label>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Seller qualification</CardTitle>
          <span className="text-xs text-text-secondary">{answeredCount} of {QUALIFICATION_FIELDS.length} answered</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-soft-blue">
          <div className="h-2 rounded-full bg-primary-blue" style={{ width: `${(answeredCount / QUALIFICATION_FIELDS.length) * 100}%` }} />
        </div>
        {nextField && (
          <p className="mt-3 rounded-card bg-soft-blue px-3 py-2 text-sm text-navy">
            <strong>Next best question:</strong> {nextField.label}
          </p>
        )}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {QUALIFICATION_FIELDS.map((f) => {
            const answer = qualification.find((q) => q.key === f.key);
            return (
              <label key={f.key} className="text-sm text-text-secondary">
                {f.label}
                <input
                  defaultValue={answer?.value ?? ""}
                  onBlur={(e) => updateAnswer(f.key, e.target.value)}
                  className={inputClass}
                />
              </label>
            );
          })}
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={saveQualification} disabled={saving}>{saving ? "Saving..." : "Save qualification"}</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Seller response assistant</CardTitle>
        <p className="mt-1 text-xs text-text-secondary">Paste or speak what the seller said. We&apos;ll pull out facts to confirm and suggest one next question -- never a list of ten.</p>
        <div className="mt-2">
          <VoiceInput value={sellerMessage} onChange={setSellerMessage} placeholder="Paste the seller's message here..." />
        </div>
        <div className="mt-2 flex justify-end">
          <Button onClick={analyzeMessage} disabled={analyzing}>{analyzing ? "Analyzing..." : "Analyze message"}</Button>
        </div>

        {analysis && (
          <div className="mt-4 flex flex-col gap-3">
            {analysis.extractedAnswers.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-text-secondary">Suggested new answers -- confirm to save</p>
                <div className="mt-1 flex flex-col gap-2">
                  {analysis.extractedAnswers.map((a) => (
                    <div key={a.field} className="flex items-center justify-between rounded-card border border-primary-blue/40 bg-soft-blue px-3 py-2 text-sm">
                      <span><strong>{labelFor(a.field as QualificationKey)}</strong>: {String(a.value)}</span>
                      <button onClick={() => confirmSuggested(a.field, a.value)} className="text-xs font-medium text-primary-blue">Confirm</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-text-secondary">What we know</p>
                {currentlyKnown.length === 0 ? <p className="text-sm text-text-secondary">Nothing confirmed yet.</p> : (
                  <ul className="list-disc pl-5 text-sm">{currentlyKnown.map((w, i) => <li key={i}>{w}</li>)}</ul>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-text-secondary">What we still need</p>
                <ul className="list-disc pl-5 text-sm">{currentlyMissing.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
            </div>
            <div className="rounded-card bg-soft-blue p-3 text-sm text-navy">
              <p className="text-xs font-semibold uppercase text-text-secondary">Suggested response</p>
              <p className="mt-1">{analysis.suggestedResponse}</p>
              <button
                onClick={() => navigator.clipboard.writeText(analysis.suggestedResponse).catch(() => {})}
                className="mt-2 text-xs font-medium text-primary-blue"
              >
                Copy response
              </button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Follow-up</CardTitle>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="text-sm text-text-secondary">Last contact
            <input type="date" defaultValue={lead.lastContactAt?.slice(0, 10) ?? ""} onBlur={(e) => patch({ lastContactAt: e.target.value || null })} className={inputClass} />
          </label>
          <label className="text-sm text-text-secondary">Next follow-up
            <input type="date" defaultValue={lead.nextFollowUpAt?.slice(0, 10) ?? ""} onBlur={(e) => patch({ nextFollowUpAt: e.target.value || null })} className={inputClass} />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="secondary" onClick={generateFollowUp}>Draft follow-up message</Button>
        </div>
        {draftFollowUp && (
          <div className="mt-3 rounded-card border border-primary-blue/40 bg-soft-blue p-3 text-sm text-navy">
            <p>{draftFollowUp}</p>
            <div className="mt-2 flex gap-3">
              <button onClick={() => navigator.clipboard.writeText(draftFollowUp).catch(() => {})} className="text-xs font-medium text-primary-blue">Copy</button>
              <button onClick={markContacted} className="text-xs font-medium text-primary-blue">I sent this -- mark contacted today</button>
            </div>
            <p className="mt-2 text-xs text-text-secondary">This app never sends messages on your behalf -- you decide when and how to send it.</p>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Deal analysis</CardTitle>
        {lead.dealId ? (
          <Link href={`/deals/${lead.dealId}`} className="mt-2 inline-block text-sm text-primary-blue">View the deal analysis for this lead &rarr;</Link>
        ) : (
          <>
            <p className="mt-1 text-sm text-text-secondary">
              Once you have enough information, hand this off to the underwriting system -- everything the seller told you
              transfers in as a fact that still needs verification, never as something already confirmed.
            </p>
            <div className="mt-3 flex justify-end">
              <Button onClick={handoff} disabled={handingOff}>{handingOff ? "Creating..." : "Create deal analysis"}</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
