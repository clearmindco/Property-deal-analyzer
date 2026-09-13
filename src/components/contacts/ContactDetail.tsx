"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  CONTACT_ROLE_LABELS, CONTACT_ROLES, PREFERRED_CONTACT_METHOD_LABELS, RELATIONSHIP_STATUS_LABELS,
  type ContactRole,
} from "@/lib/types/contact";
import { DEAL_STAGE_LABELS, SOURCE_TYPE_LABELS, type DealStage, type SourceType } from "@/lib/types/deal";
import { resolveTotalAcquisitionPrice } from "@/lib/calc/acquisitionTotal";

interface LinkedDeal {
  id: string; address: string; stage: string; sourceType: string | null;
  askingPrice: number | null; contractPrice: number | null; assignmentFee: number | null;
}

interface Contact {
  id: string; name: string; company: string | null; phone: string | null; email: string | null;
  notes: string | null; roles: ContactRole[]; market: string | null; leadSource: string | null;
  relationshipStatus: string | null; preferredContactMethod: string | null;
  lastContactAt: string | null; nextFollowUpAt: string | null;
}

function money(n: number | null): string {
  if (n === null) return "--";
  return `$${Math.round(n).toLocaleString()}`;
}

export function ContactDetail({ contact: initial, deals }: { contact: Contact; deals: LinkedDeal[] }) {
  const [contact, setContact] = useState(initial);
  const [saving, setSaving] = useState(false);

  function toggleRole(role: ContactRole) {
    setContact((c) => ({
      ...c,
      roles: c.roles.includes(role) ? c.roles.filter((r) => r !== role) : [...c.roles, role],
    }));
  }

  async function save(patch: Partial<Contact> = {}) {
    setSaving(true);
    const next = { ...contact, ...patch };
    setContact(next);
    await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...patch, roles: next.roles }),
    });
    setSaving(false);
  }

  const closedCount = deals.filter((d) => d.stage === "CLOSED").length;
  const inputClass = "mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/contacts" className="text-sm text-primary-blue hover:underline">&larr; Contacts</Link>
        <h1 className="mt-1 text-2xl font-bold text-navy">{contact.name}{contact.company ? ` (${contact.company})` : ""}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONTACT_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => { toggleRole(role); save({ roles: contact.roles.includes(role) ? contact.roles.filter((r) => r !== role) : [...contact.roles, role] }); }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                contact.roles.includes(role) ? "border-primary-blue bg-soft-blue text-navy" : "border-silver/50 text-text-secondary hover:text-navy"
              }`}
            >
              {CONTACT_ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardTitle>Relationship</CardTitle>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-sm text-text-secondary">
            Phone
            <input value={contact.phone ?? ""} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} className={inputClass} />
          </label>
          <label className="text-sm text-text-secondary">
            Email
            <input value={contact.email ?? ""} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} className={inputClass} />
          </label>
          <label className="text-sm text-text-secondary">
            Market
            <input value={contact.market ?? ""} onChange={(e) => setContact((c) => ({ ...c, market: e.target.value }))} className={inputClass} />
          </label>
          <label className="text-sm text-text-secondary">
            Lead source
            <input placeholder="e.g. Facebook group, referral name" value={contact.leadSource ?? ""} onChange={(e) => setContact((c) => ({ ...c, leadSource: e.target.value }))} className={inputClass} />
          </label>
          <label className="text-sm text-text-secondary">
            Relationship status
            <select value={contact.relationshipStatus ?? ""} onChange={(e) => setContact((c) => ({ ...c, relationshipStatus: e.target.value }))} className={inputClass}>
              <option value="">Unset</option>
              {Object.entries(RELATIONSHIP_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="text-sm text-text-secondary">
            Preferred contact method
            <select value={contact.preferredContactMethod ?? ""} onChange={(e) => setContact((c) => ({ ...c, preferredContactMethod: e.target.value }))} className={inputClass}>
              <option value="">Unset</option>
              {Object.entries(PREFERRED_CONTACT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="text-sm text-text-secondary">
            Next follow-up
            <input type="date" value={contact.nextFollowUpAt?.slice(0, 10) ?? ""} onChange={(e) => setContact((c) => ({ ...c, nextFollowUpAt: e.target.value }))} className={inputClass} />
          </label>
        </div>
        <label className="mt-3 block text-sm text-text-secondary">
          Notes
          <textarea value={contact.notes ?? ""} onChange={(e) => setContact((c) => ({ ...c, notes: e.target.value }))} rows={3} className={inputClass} />
        </label>
        <Button
          className="mt-3"
          disabled={saving}
          onClick={() => save({
            phone: contact.phone, email: contact.email, market: contact.market, leadSource: contact.leadSource,
            relationshipStatus: contact.relationshipStatus, preferredContactMethod: contact.preferredContactMethod,
            nextFollowUpAt: contact.nextFollowUpAt, notes: contact.notes,
          })}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Properties ({deals.length})</CardTitle>
          <span className="text-xs text-text-secondary">{closedCount} closed</span>
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          Every property this contact sourced, owns, or is otherwise tied to keeps its own independent pricing,
          underwriting, and stage -- an assignment fee never attaches itself to a property this contact personally owns.
        </p>
        <div className="mt-3 flex flex-col divide-y divide-silver/20">
          {deals.length === 0 && <p className="py-3 text-sm text-text-secondary">No properties linked to this contact yet.</p>}
          {deals.map((d) => {
            const total = d.sourceType === "WHOLESALER"
              ? resolveTotalAcquisitionPrice(d.contractPrice, d.assignmentFee).totalAcquisitionPrice
              : d.askingPrice;
            return (
              <Link key={d.id} href={`/deals/${d.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-soft-blue/30">
                <div>
                  <p className="font-medium text-text-primary">{d.address}</p>
                  <p className="text-text-secondary">
                    {d.sourceType ? SOURCE_TYPE_LABELS[d.sourceType as SourceType] : "Source not set"}
                    {" · "}{DEAL_STAGE_LABELS[d.stage as DealStage] ?? d.stage}
                  </p>
                </div>
                <p className="font-medium text-navy">{money(total)}</p>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
