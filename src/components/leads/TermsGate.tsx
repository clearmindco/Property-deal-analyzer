"use client";

import { Card, CardTitle } from "@/components/ui/Card";
import type { VerificationChecklistItem } from "@/lib/types/leadgen";

export function TermsGate({
  checklist,
  onToggle,
}: {
  checklist: VerificationChecklistItem[];
  onToggle: (item: string, checked: boolean) => void;
}) {
  const checkedCount = checklist.filter((c) => c.checked).length;

  return (
    <Card className="border-warning/50 bg-warning/5">
      <div className="flex items-center justify-between">
        <CardTitle className="text-navy">Potential creative-finance opportunity</CardTitle>
        <span className="text-xs font-medium text-text-secondary">{checkedCount} of {checklist.length} verified</span>
      </div>
      <p className="mt-1 text-sm font-bold text-warning">DO NOT SIGN YET.</p>
      <p className="mt-2 text-sm text-text-secondary">
        A seller saying yes to terms is not automatically a deal. Before proceeding, verify each applicable item below.
        Nothing here is checked for you.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {checklist.map((c) => (
          <label key={c.item} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={c.checked} onChange={(e) => onToggle(c.item, e.target.checked)} />
            {c.item}
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs text-text-secondary">
        Qualified professionals (attorney, title, lender) handle the legal/tax pieces -- this checklist organizes
        what to verify, it doesn&apos;t verify anything on its own.
      </p>
    </Card>
  );
}
