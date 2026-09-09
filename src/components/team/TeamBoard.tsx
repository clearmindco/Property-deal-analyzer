"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const TRADES = [
  "general_contractor", "handyman", "hvac", "plumbing", "electrical", "roofing", "sewer",
  "foundation", "inspector", "property_manager", "attorney", "insurance_agent",
  "hard_money_lender", "dscr_lender", "title_closing", "other",
];

const CATEGORY_STYLES: Record<string, string> = {
  PREFERRED: "bg-success/15 text-success",
  BACKUP: "bg-slate/15 text-slate",
  DO_NOT_USE: "bg-danger/10 text-danger",
};

interface Contact {
  id: string; name: string; company: string | null; trade: string; phone: string | null;
  email: string | null; category: string; notes: string | null;
}

export function TeamBoard({ initialContacts }: { initialContacts: Contact[] }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [form, setForm] = useState({ name: "", company: "", trade: "general_contractor", phone: "", email: "", category: "BACKUP" });
  const [creating, setCreating] = useState(false);

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setCreating(false);
    if (res.ok) {
      const contact = await res.json();
      setContacts((c) => [contact, ...c]);
      setForm({ name: "", company: "", trade: "general_contractor", phone: "", email: "", category: "BACKUP" });
    }
  }

  async function updateCategory(id: string, category: string) {
    setContacts((c) => c.map((x) => (x.id === id ? { ...x, category } : x)));
    await fetch(`/api/contacts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category }) });
  }

  const inputClass = "mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-navy">Team</h1>

      <Card>
        <CardTitle>Add a contact</CardTitle>
        <form onSubmit={addContact} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-6">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
          <input placeholder="Company" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} className={inputClass} />
          <select value={form.trade} onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value }))} className={inputClass}>
            {TRADES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
          <Button type="submit" disabled={creating}>{creating ? "Adding..." : "Add"}</Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Contacts</CardTitle>
        <div className="mt-3 flex flex-col divide-y divide-silver/20">
          {contacts.length === 0 && <p className="py-3 text-sm text-text-secondary">No contacts yet.</p>}
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-text-primary">{c.name} {c.company ? `(${c.company})` : ""}</p>
                <p className="text-text-secondary">{c.trade.replace(/_/g, " ")} {c.phone ? `· ${c.phone}` : ""}</p>
              </div>
              <select
                value={c.category}
                onChange={(e) => updateCategory(c.id, e.target.value)}
                className={`rounded-full border-0 px-3 py-1 text-xs font-medium ${CATEGORY_STYLES[c.category]}`}
              >
                <option value="PREFERRED">Preferred</option>
                <option value="BACKUP">Backup</option>
                <option value="DO_NOT_USE">Do not use</option>
              </select>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
