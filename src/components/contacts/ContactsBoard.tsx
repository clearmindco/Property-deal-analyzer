"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CONTACT_ROLE_LABELS, CONTACT_ROLES, type ContactRole } from "@/lib/types/contact";

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
  id: string; name: string; company: string | null; trade: string | null; phone: string | null;
  email: string | null; category: string | null; notes: string | null; roles: ContactRole[];
  market: string | null;
}

const emptyForm = {
  name: "", company: "", phone: "", email: "", market: "",
  roles: [] as ContactRole[], trade: "general_contractor", category: "BACKUP",
};

export function ContactsBoard({ initialContacts }: { initialContacts: Contact[] }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);

  const isContractor = form.roles.includes("CONTRACTOR");

  function toggleRole(role: ContactRole) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }));
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    const payload = {
      name: form.name, company: form.company || undefined, phone: form.phone || undefined,
      email: form.email || undefined, market: form.market || undefined, roles: form.roles,
      trade: isContractor ? form.trade : undefined,
      category: isContractor ? form.category : undefined,
    };
    const res = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setCreating(false);
    if (res.ok) {
      const contact = await res.json();
      setContacts((c) => [contact, ...c]);
      setForm(emptyForm);
    }
  }

  const inputClass = "mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Contacts</h1>
        <p className="text-text-secondary">
          One record per person -- sellers, realtors, wholesalers, lenders, contractors, and everyone else. A
          person can hold multiple roles at once; this app never creates a duplicate contact just because they
          sent another property.
        </p>
      </div>

      <Card>
        <CardTitle>Add a contact</CardTitle>
        <form onSubmit={addContact} className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-sm text-text-secondary">
              Name
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
            </label>
            <label className="text-sm text-text-secondary">
              Company
              <input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} className={inputClass} />
            </label>
            <label className="text-sm text-text-secondary">
              Phone
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
            </label>
            <label className="text-sm text-text-secondary">
              Email
              <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
            </label>
            <label className="text-sm text-text-secondary sm:col-span-2">
              Market
              <input placeholder="e.g. Rochester, NY" value={form.market} onChange={(e) => setForm((f) => ({ ...f, market: e.target.value }))} className={inputClass} />
            </label>
          </div>

          <div>
            <p className="text-sm text-text-secondary">Roles (select all that apply)</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {CONTACT_ROLES.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    form.roles.includes(role) ? "border-primary-blue bg-soft-blue text-navy" : "border-silver/50 text-text-secondary hover:text-navy"
                  }`}
                >
                  {CONTACT_ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>

          {isContractor && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="text-sm text-text-secondary">
                Trade
                <select value={form.trade} onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value }))} className={inputClass}>
                  {TRADES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </label>
              <label className="text-sm text-text-secondary">
                Rating
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={inputClass}>
                  <option value="PREFERRED">Preferred</option>
                  <option value="BACKUP">Backup</option>
                  <option value="DO_NOT_USE">Do not use</option>
                </select>
              </label>
            </div>
          )}

          <div>
            <Button type="submit" disabled={creating}>{creating ? "Adding..." : "Add contact"}</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle>All contacts</CardTitle>
        <div className="mt-3 flex flex-col divide-y divide-silver/20">
          {contacts.length === 0 && <p className="py-3 text-sm text-text-secondary">No contacts yet.</p>}
          {contacts.map((c) => (
            <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-soft-blue/30">
              <div>
                <p className="font-medium text-text-primary">{c.name} {c.company ? `(${c.company})` : ""}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {c.roles.length === 0 && <span className="text-xs text-text-secondary">No role set</span>}
                  {c.roles.map((r) => (
                    <span key={r} className="rounded-full bg-soft-blue px-2 py-0.5 text-[11px] font-medium text-navy">{CONTACT_ROLE_LABELS[r]}</span>
                  ))}
                </div>
                <p className="mt-1 text-text-secondary">
                  {c.market ? `${c.market} · ` : ""}{c.phone ?? c.email ?? ""}
                  {c.trade ? ` · ${c.trade.replace(/_/g, " ")}` : ""}
                </p>
              </div>
              {c.category && (
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_STYLES[c.category]}`}>
                  {c.category.replace(/_/g, " ").toLowerCase()}
                </span>
              )}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
