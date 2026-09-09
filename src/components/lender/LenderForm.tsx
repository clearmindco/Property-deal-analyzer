"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HardMoneyTerms } from "@/lib/types/deal";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface LenderFormValue {
  id?: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  website: string;
  geography: string;
  loanType: string;
  verified: boolean;
  notes: string;
  terms: HardMoneyTerms;
}

const DEFAULT_TERMS: HardMoneyTerms = {
  ratePct: 0.11, points: 2, purchaseFinancedPct: 0.9, rehabFinancedPct: 1.0,
  ltcCapPct: 0.9, arvLtvCapPct: 0.7, termMonths: 12, rehabInterestOnFullCommitment: false,
};

export function LenderForm({ initial }: { initial?: LenderFormValue }) {
  const router = useRouter();
  const [value, setValue] = useState<LenderFormValue>(
    initial ?? { name: "", contact: "", email: "", phone: "", website: "", geography: "", loanType: "hard_money", verified: false, notes: "", terms: DEFAULT_TERMS }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTerm<K extends keyof HardMoneyTerms>(key: K, raw: string) {
    setValue((v) => ({ ...v, terms: { ...v.terms, [key]: raw === "" ? undefined : Number(raw) } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = { name: value.name, contact: value.contact, email: value.email, phone: value.phone, website: value.website, geography: value.geography, loanType: value.loanType, verified: value.verified, notes: value.notes, terms: value.terms };
    const res = await fetch(value.id ? `/api/lenders/${value.id}` : "/api/lenders", {
      method: value.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
    router.push("/lenders");
    router.refresh();
  }

  const inputClass = "mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm";
  const labelClass = "text-sm font-medium text-text-secondary";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardTitle>Lender info</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <label className={labelClass}>Name<input required value={value.name} onChange={(e) => setValue((v) => ({ ...v, name: e.target.value }))} className={inputClass} /></label>
          <label className={labelClass}>Contact<input value={value.contact} onChange={(e) => setValue((v) => ({ ...v, contact: e.target.value }))} className={inputClass} /></label>
          <label className={labelClass}>Email<input value={value.email} onChange={(e) => setValue((v) => ({ ...v, email: e.target.value }))} className={inputClass} /></label>
          <label className={labelClass}>Phone<input value={value.phone} onChange={(e) => setValue((v) => ({ ...v, phone: e.target.value }))} className={inputClass} /></label>
          <label className={labelClass}>Geography<input value={value.geography} onChange={(e) => setValue((v) => ({ ...v, geography: e.target.value }))} className={inputClass} /></label>
          <label className={labelClass}>Loan type
            <select value={value.loanType} onChange={(e) => setValue((v) => ({ ...v, loanType: e.target.value }))} className={inputClass}>
              <option value="hard_money">Hard money</option>
              <option value="dscr">DSCR</option>
              <option value="conventional">Conventional</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={value.verified} onChange={(e) => setValue((v) => ({ ...v, verified: e.target.checked }))} />
          This is a direct verified quote (overrides generic advertised terms)
        </label>
      </Card>

      <Card>
        <CardTitle>Terms</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className={labelClass}>Rate %<input type="number" step={0.1} value={value.terms.ratePct * 100} onChange={(e) => setValue((v) => ({ ...v, terms: { ...v.terms, ratePct: Number(e.target.value) / 100 } }))} className={inputClass} /></label>
          <label className={labelClass}>Points<input type="number" step={0.1} value={value.terms.points} onChange={(e) => updateTerm("points", e.target.value)} className={inputClass} /></label>
          <label className={labelClass}>Purchase financed %<input type="number" value={value.terms.purchaseFinancedPct * 100} onChange={(e) => setValue((v) => ({ ...v, terms: { ...v.terms, purchaseFinancedPct: Number(e.target.value) / 100 } }))} className={inputClass} /></label>
          <label className={labelClass}>Rehab financed %<input type="number" value={value.terms.rehabFinancedPct * 100} onChange={(e) => setValue((v) => ({ ...v, terms: { ...v.terms, rehabFinancedPct: Number(e.target.value) / 100 } }))} className={inputClass} /></label>
          <label className={labelClass}>LTC cap %<input type="number" value={(value.terms.ltcCapPct ?? 0.9) * 100} onChange={(e) => setValue((v) => ({ ...v, terms: { ...v.terms, ltcCapPct: Number(e.target.value) / 100 } }))} className={inputClass} /></label>
          <label className={labelClass}>ARV/LTV cap %<input type="number" value={(value.terms.arvLtvCapPct ?? 0.7) * 100} onChange={(e) => setValue((v) => ({ ...v, terms: { ...v.terms, arvLtvCapPct: Number(e.target.value) / 100 } }))} className={inputClass} /></label>
          <label className={labelClass}>Min loan ($)<input type="number" value={value.terms.minLoan ?? ""} onChange={(e) => updateTerm("minLoan", e.target.value)} className={inputClass} /></label>
          <label className={labelClass}>Max loan ($)<input type="number" value={value.terms.maxLoan ?? ""} onChange={(e) => updateTerm("maxLoan", e.target.value)} className={inputClass} /></label>
          <label className={labelClass}>Draw fee ($)<input type="number" value={value.terms.drawFee ?? ""} onChange={(e) => updateTerm("drawFee", e.target.value)} className={inputClass} /></label>
          <label className={labelClass}>Appraisal fee ($)<input type="number" value={value.terms.appraisalFee ?? ""} onChange={(e) => updateTerm("appraisalFee", e.target.value)} className={inputClass} /></label>
          <label className={labelClass}>Underwriting fee ($)<input type="number" value={value.terms.underwritingFee ?? ""} onChange={(e) => updateTerm("underwritingFee", e.target.value)} className={inputClass} /></label>
          <label className={labelClass}>Term (months)<input type="number" value={value.terms.termMonths} onChange={(e) => updateTerm("termMonths", e.target.value)} className={inputClass} /></label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={value.terms.rehabInterestOnFullCommitment ?? false} onChange={(e) => setValue((v) => ({ ...v, terms: { ...v.terms, rehabInterestOnFullCommitment: e.target.checked } }))} />
          Charges interest on the full rehab commitment (not just drawn balance)
        </label>
      </Card>

      <Card>
        <CardTitle>Notes</CardTitle>
        <textarea value={value.notes} onChange={(e) => setValue((v) => ({ ...v, notes: e.target.value }))} rows={3} className={`${inputClass} mt-2`} />
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : value.id ? "Save changes" : "Add lender"}</Button>
      </div>
    </form>
  );
}
