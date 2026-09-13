"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  DEAL_STAGE_LABELS, DEAL_STAGES, FOLLOW_UP_CADENCE_LABELS, NEXT_ACTION_OWNER_LABELS,
  NEXT_CONTACT_METHOD_LABELS, SOURCE_TYPE_LABELS,
} from "@/lib/types/deal";
import { CONTACT_ROLE_LABELS, type ContactRole } from "@/lib/types/contact";
import { resolveTotalAcquisitionPrice } from "@/lib/calc/acquisitionTotal";

export interface SourceState {
  stage: string;
  sourceContactId: string;
  sourceType: string;
  contractPrice: string;
  assignmentFee: string;
  nextAction: string;
  nextActionOwner: string;
  nextContactMethod: string;
  followUpCadence: string;
}

interface ContactOption {
  id: string; name: string; roles: ContactRole[];
}

export function DealSourceCard({
  source, onChange, onSave, saving,
}: {
  source: SourceState;
  onChange: (next: SourceState) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [contacts, setContacts] = useState<ContactOption[]>([]);

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => (r.ok ? r.json() : []))
      .then(setContacts)
      .catch(() => {});
  }, []);

  const inputClass = "mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm";
  const labelClass = "text-sm font-medium text-text-secondary";
  const isWholesaler = source.sourceType === "WHOLESALER";
  const total = resolveTotalAcquisitionPrice(
    source.contractPrice ? Number(source.contractPrice) : null,
    source.assignmentFee ? Number(source.assignmentFee) : null
  );

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Source & pipeline</CardTitle>
        <Link href="/contacts" className="text-xs text-primary-blue hover:underline">Manage contacts &rarr;</Link>
      </div>
      <p className="mt-1 text-xs text-text-secondary">
        Who this property came from and what stage it&apos;s at -- required before the app can route this deal
        through the right workflow (a wholesaler&apos;s contract never gets asked seller-motivation questions).
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          Deal stage
          <select value={source.stage} onChange={(e) => onChange({ ...source, stage: e.target.value })} className={inputClass}>
            {DEAL_STAGES.map((s) => <option key={s} value={s}>{DEAL_STAGE_LABELS[s]}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Source contact
          <select value={source.sourceContactId} onChange={(e) => onChange({ ...source, sourceContactId: e.target.value })} className={inputClass}>
            <option value="">Not set</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.roles.length > 0 ? ` (${c.roles.map((r) => CONTACT_ROLE_LABELS[r]).join(", ")})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Source type
          <select value={source.sourceType} onChange={(e) => onChange({ ...source, sourceType: e.target.value })} className={inputClass}>
            <option value="">Not set</option>
            {Object.entries(SOURCE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>

      {isWholesaler && (
        <div className="mt-3 rounded-card border border-silver/30 p-3">
          <p className="text-xs font-semibold uppercase text-text-secondary">Wholesaler math</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              Contract price
              <input type="number" value={source.contractPrice} onChange={(e) => onChange({ ...source, contractPrice: e.target.value })} className={inputClass} />
            </label>
            <label className={labelClass}>
              Assignment fee
              <input type="number" value={source.assignmentFee} onChange={(e) => onChange({ ...source, assignmentFee: e.target.value })} className={inputClass} />
            </label>
            <div>
              <p className={labelClass}>Total acquisition price</p>
              <p className="mt-1 rounded-card bg-soft-blue px-3 py-2 text-sm font-semibold text-navy">
                ${Math.round(total.totalAcquisitionPrice).toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            Always contract price + assignment fee, shown separately -- the fee is never folded into a single
            blended number.
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <label className={labelClass}>
          Who owes the next response?
          <select value={source.nextActionOwner} onChange={(e) => onChange({ ...source, nextActionOwner: e.target.value })} className={inputClass}>
            <option value="">Not set</option>
            {Object.entries(NEXT_ACTION_OWNER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Next contact method
          <select value={source.nextContactMethod} onChange={(e) => onChange({ ...source, nextContactMethod: e.target.value })} className={inputClass}>
            <option value="">Not set</option>
            {Object.entries(NEXT_CONTACT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Follow-up cadence
          <select value={source.followUpCadence} onChange={(e) => onChange({ ...source, followUpCadence: e.target.value })} className={inputClass}>
            <option value="">Not set</option>
            {Object.entries(FOLLOW_UP_CADENCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Next action
          <input placeholder="e.g. Request mortgage statement" value={source.nextAction} onChange={(e) => onChange({ ...source, nextAction: e.target.value })} className={inputClass} />
        </label>
      </div>

      <div className="mt-3 flex justify-end">
        <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save source & pipeline"}</Button>
      </div>
    </Card>
  );
}
