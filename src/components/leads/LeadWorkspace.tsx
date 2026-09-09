"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { InfoTooltip } from "@/components/ui/Tooltip";
import { getAiProvider } from "@/lib/ai/provider";
import type { SellerMessageAnalysis } from "@/lib/ai/types";
import {
  computeLeadPriority, coreQuestionsAnsweredCount, draftFollowUpMessage, nextCoreQuestion, routeStrategy,
} from "@/lib/leadgen";
import {
  CORE_QUESTIONS, QUALIFICATION_FIELDS, VERIFICATION_CHECKLIST_ITEMS,
  type QualificationAnswer, type QualificationKey, type VerificationChecklistItem,
} from "@/lib/types/leadgen";
import { NextQuestionCard } from "./NextQuestionCard";
import { ObjectionAssistant } from "./ObjectionAssistant";
import { StrategyRouterCard } from "./StrategyRouterCard";
import { TermsGate } from "./TermsGate";

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
  skippedQuestions: number[] | null;
  verificationChecklist: VerificationChecklistItem[] | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
}

function labelFor(key: QualificationKey): string {
  return QUALIFICATION_FIELDS.find((f) => f.key === key)?.label ?? key;
}

function defaultChecklist(): VerificationChecklistItem[] {
  return VERIFICATION_CHECKLIST_ITEMS.map((item) => ({ item, checked: false }));
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
  const [skippedQuestions, setSkippedQuestions] = useState<number[]>(initialLead.skippedQuestions ?? []);
  const [verificationChecklist, setVerificationChecklist] = useState<VerificationChecklistItem[]>(
    initialLead.verificationChecklist ?? defaultChecklist()
  );
  const [sellerMessage, setSellerMessage] = useState("");
  const [analysis, setAnalysis] = useState<SellerMessageAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftFollowUp, setDraftFollowUp] = useState<string | null>(null);
  const [handingOff, setHandingOff] = useState(false);

  const priority = useMemo(() => computeLeadPriority(qualification), [qualification]);
  const coreAnsweredCount = useMemo(() => coreQuestionsAnsweredCount(qualification), [qualification]);
  const nextQuestion = useMemo(() => nextCoreQuestion(qualification, skippedQuestions), [qualification, skippedQuestions]);
  const strategy = useMemo(() => routeStrategy(qualification, priority), [qualification, priority]);
  const termsResponseValue = qualification.find((q) => q.key === "termsResponse" && q.confirmed)?.value;
  const showTermsGate = termsResponseValue === "OPEN_TO_TERMS" || termsResponseValue === "MAYBE_NEEDS_EXPLANATION";

  const answeredTopics = useMemo(
    () => CORE_QUESTIONS.filter((q) => qualification.some((a) => q.fields.includes(a.key) && a.confirmed && a.value.trim())).map((q) => q.topic),
    [qualification]
  );

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

  async function commitQualification(next: QualificationAnswer[]) {
    setQualification(next);
    const p = computeLeadPriority(next);
    await patch({ qualification: next, priorityLevel: p.level, priorityReasons: p.reasons });
  }

  function updateAnswer(key: QualificationKey, value: string, source: QualificationAnswer["source"] = "manual") {
    const existing = qualification.find((q) => q.key === key);
    const next = existing
      ? qualification.map((q) => (q.key === key ? { ...q, value, confirmed: true, source } : q))
      : [...qualification, { key, value, confirmed: true, source }];
    void commitQualification(next);
  }

  async function skipQuestion(id: number) {
    const next = [...skippedQuestions, id];
    setSkippedQuestions(next);
    await patch({ skippedQuestions: next });
  }

  async function toggleChecklistItem(item: string, checked: boolean) {
    const next = verificationChecklist.map((c) => (c.item === item ? { ...c, checked } : c));
    setVerificationChecklist(next);
    await patch({ verificationChecklist: next });
  }

  async function analyzeMessage() {
    if (!sellerMessage.trim()) return;
    setAnalyzing(true);
    const existing = qualification.map((q) => ({ key: q.key, label: labelFor(q.key), value: q.value, confirmed: q.confirmed }));
    const result = await getAiProvider().analyzeSellerMessage(sellerMessage, existing);
    setAnalysis(result);
    setAnalyzing(false);
  }

  function editExtracted(field: string, value: string) {
    setAnalysis((a) => (a ? { ...a, extractedAnswers: a.extractedAnswers.map((x) => (x.field === field ? { ...x, value } : x)) } : a));
  }

  function confirmSuggested(field: string, value: string | number | boolean) {
    updateAnswer(field as QualificationKey, String(value), "seller_message");
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
    setDraftFollowUp(draftFollowUpMessage(lead.sellerName, lead.address ?? undefined, nextQuestion?.question));
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
          {answeredTopics.length > 0 && (
            <p className="mt-1 text-sm text-text-secondary">
              You already know: {answeredTopics.join(", ")} ({coreAnsweredCount}/10). Don&apos;t restart qualification.
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
          <CardTitle>
            Seller qualification
            <InfoTooltip text="Questions 1-8 and 10 are reconstructed from the Creative Finance Playbook framework we studied. Question 9 (payment + rate) is our own underwriting addition -- it's essential for evaluating any payment-based structure but isn't part of the original source material." />
          </CardTitle>
          <span className="text-xs text-text-secondary">{coreAnsweredCount} of 10 core questions answered</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-soft-blue">
          <div className="h-2 rounded-full bg-primary-blue" style={{ width: `${(coreAnsweredCount / 10) * 100}%` }} />
        </div>
      </Card>

      <NextQuestionCard
        question={nextQuestion}
        onMarkAnswered={(field, value) => updateAnswer(field as QualificationKey, value)}
        onSkip={skipQuestion}
        onSellerDoesntKnow={(field) => updateAnswer(field as QualificationKey, "Unknown")}
      />

      <Card>
        <CardTitle>All fields</CardTitle>
        <p className="mt-1 text-xs text-text-secondary">Every fact the 10 questions can capture -- fill in anything you already know.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {QUALIFICATION_FIELDS.map((f) => {
            const answer = qualification.find((q) => q.key === f.key);
            return (
              <label key={f.key} className="text-sm text-text-secondary">
                {f.label}
                <input
                  defaultValue={answer?.value ?? ""}
                  onBlur={(e) => e.target.value !== (answer?.value ?? "") && updateAnswer(f.key, e.target.value)}
                  className={inputClass}
                />
              </label>
            );
          })}
        </div>
        {saving && <p className="mt-2 text-xs text-text-secondary">Saving...</p>}
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
                <p className="text-xs font-semibold uppercase text-text-secondary">Here&apos;s what I heard -- confirm or edit</p>
                <div className="mt-1 flex flex-col gap-2">
                  {analysis.extractedAnswers.map((a) => (
                    <div key={a.field} className="flex items-center gap-2 rounded-card border border-primary-blue/40 bg-soft-blue px-3 py-2 text-sm">
                      <strong className="whitespace-nowrap">{labelFor(a.field as QualificationKey)}:</strong>
                      <input
                        value={String(a.value)}
                        onChange={(e) => editExtracted(a.field, e.target.value)}
                        className="flex-1 rounded-card border border-primary-blue/30 bg-canvas px-2 py-1 text-sm"
                      />
                      <button onClick={() => confirmSuggested(a.field, a.value)} className="whitespace-nowrap text-xs font-medium text-primary-blue">Confirm</button>
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
              <p className="text-xs font-semibold uppercase text-text-secondary">Suggested response (next best question)</p>
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

      <ObjectionAssistant />

      <StrategyRouterCard result={strategy} />

      {showTermsGate && (
        <TermsGate checklist={verificationChecklist} onToggle={toggleChecklistItem} />
      )}

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
