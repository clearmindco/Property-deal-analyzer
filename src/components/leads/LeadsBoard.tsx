"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VoiceInput } from "@/components/ui/VoiceInput";

const STATUSES = [
  "NEW", "TALKING", "QUALIFIED", "CALL_SCHEDULED", "ANALYZING", "OFFER",
  "FOLLOW_UP", "UNDER_CONTRACT", "CLOSED", "DEAD",
] as const;

interface Lead {
  id: string; sellerName: string; address: string | null; phone: string | null;
  email: string | null; status: string; notes: string | null;
}

export function LeadsBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [form, setForm] = useState({ sellerName: "", address: "", phone: "", email: "", notes: "" });
  const [creating, setCreating] = useState(false);

  async function addLead(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sellerName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreating(false);
    if (res.ok) {
      const lead = await res.json();
      setLeads((l) => [lead, ...l]);
      setForm({ sellerName: "", address: "", phone: "", email: "", notes: "" });
    }
  }

  async function updateStatus(id: string, status: string) {
    setLeads((l) => l.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  const inputClass = "mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-navy">Seller leads</h1>

      <Card>
        <CardTitle>Add a lead</CardTitle>
        <form onSubmit={addLead} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <input placeholder="Seller name" value={form.sellerName} onChange={(e) => setForm((f) => ({ ...f, sellerName: e.target.value }))} className={inputClass} />
          <input placeholder="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className={inputClass} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
          <Button type="submit" disabled={creating}>{creating ? "Adding..." : "Add lead"}</Button>
        </form>
        <div className="mt-3">
          <VoiceInput value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="Notes from the seller conversation..." />
        </div>
      </Card>

      <Card>
        <CardTitle>Pipeline</CardTitle>
        <div className="mt-3 flex flex-col divide-y divide-silver/20">
          {leads.length === 0 && <p className="py-3 text-sm text-text-secondary">No leads yet.</p>}
          {leads.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-text-primary">{lead.sellerName}</p>
                <p className="text-text-secondary">{lead.address || "No address"} {lead.phone ? `· ${lead.phone}` : ""}</p>
              </div>
              <select
                value={lead.status}
                onChange={(e) => updateStatus(lead.id, e.target.value)}
                className="rounded-card border border-silver/40 bg-canvas px-2 py-1 text-xs"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
