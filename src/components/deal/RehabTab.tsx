"use client";

import { useState } from "react";
import type { Rehab, RehabCategory, RehabLineItem } from "@/lib/types/deal";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const CATEGORIES: RehabCategory[] = [
  "roof", "gutters", "foundation", "basement_water", "sewer", "electrical_panel", "rewiring",
  "plumbing", "pex", "boiler", "furnace", "central_ac", "water_heater", "windows", "doors",
  "kitchen", "cabinets", "counters", "appliances", "bathrooms", "flooring", "drywall", "paint",
  "lighting", "trim", "siding", "driveway", "landscaping", "trash_out", "permits", "co_code", "other",
];

function formatCategory(c: RehabCategory): string {
  return c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function RehabTab({
  rehab,
  onChange,
  onSave,
  saving,
}: {
  rehab: Rehab;
  onChange: (next: Rehab) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<Partial<RehabLineItem>>({ category: "kitchen" });

  function addItem() {
    if (draft.expected === undefined) return;
    const item: RehabLineItem = {
      category: draft.category ?? "other",
      low: draft.low ?? draft.expected,
      expected: draft.expected,
      high: draft.high ?? draft.expected,
      needsInspection: draft.needsInspection ?? false,
      notes: draft.notes,
    };
    onChange({ ...rehab, lineItems: [...rehab.lineItems, item] });
    setDraft({ category: "kitchen" });
  }

  function removeItem(index: number) {
    onChange({ ...rehab, lineItems: rehab.lineItems.filter((_, i) => i !== index) });
  }

  const subtotalExpected = rehab.lineItems.reduce((s, i) => s + i.expected, 0);
  const total = subtotalExpected * (1 + rehab.contingencyPct);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardTitle>Rehab line items</CardTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary">
                <th className="py-1">Category</th>
                <th>Low</th>
                <th>Expected</th>
                <th>High</th>
                <th>Inspect?</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rehab.lineItems.map((item, idx) => (
                <tr key={idx} className="border-t border-silver/20">
                  <td className="py-2">{formatCategory(item.category)}</td>
                  <td>${item.low.toLocaleString()}</td>
                  <td className="font-medium">${item.expected.toLocaleString()}</td>
                  <td>${item.high.toLocaleString()}</td>
                  <td>{item.needsInspection ? "Needs inspection" : "--"}</td>
                  <td><button onClick={() => removeItem(idx)} className="text-xs text-danger">Remove</button></td>
                </tr>
              ))}
              {rehab.lineItems.length === 0 && (
                <tr><td colSpan={6} className="py-3 text-text-secondary">No rehab items yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
          <select value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as RehabCategory }))} className="col-span-2 rounded-card border border-silver/60 bg-canvas px-2 py-2 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{formatCategory(c)}</option>)}
          </select>
          <input type="number" placeholder="Low" value={draft.low ?? ""} onChange={(e) => setDraft((d) => ({ ...d, low: Number(e.target.value) }))} className="rounded-card border border-silver/60 bg-canvas px-2 py-2 text-sm" />
          <input type="number" placeholder="Expected" value={draft.expected ?? ""} onChange={(e) => setDraft((d) => ({ ...d, expected: Number(e.target.value) }))} className="rounded-card border border-silver/60 bg-canvas px-2 py-2 text-sm" />
          <input type="number" placeholder="High" value={draft.high ?? ""} onChange={(e) => setDraft((d) => ({ ...d, high: Number(e.target.value) }))} className="rounded-card border border-silver/60 bg-canvas px-2 py-2 text-sm" />
          <Button onClick={addItem}>Add item</Button>
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
          <input type="checkbox" checked={draft.needsInspection ?? false} onChange={(e) => setDraft((d) => ({ ...d, needsInspection: e.target.checked }))} />
          Hidden system -- photos can&apos;t confirm this, needs inspection
        </label>
      </Card>

      <Card>
        <CardTitle>Contingency</CardTitle>
        <div className="mt-3 flex items-center gap-4">
          <input
            type="range" min={0.1} max={0.2} step={0.01}
            value={rehab.contingencyPct}
            onChange={(e) => onChange({ ...rehab, contingencyPct: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="w-16 text-sm font-medium">{Math.round(rehab.contingencyPct * 100)}%</span>
        </div>
        <div className="mt-4 flex justify-between rounded-card bg-soft-blue px-4 py-3 text-sm">
          <span>Subtotal (expected): <strong>${Math.round(subtotalExpected).toLocaleString()}</strong></span>
          <span>Total with contingency: <strong>${Math.round(total).toLocaleString()}</strong></span>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save rehab estimate"}</Button>
      </div>
    </div>
  );
}
