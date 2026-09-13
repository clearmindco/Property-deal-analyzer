"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface CompanySettingsRecord {
  cashOnHand: number | null;
  reserveMinimum: number | null;
  committedCapital: number | null;
}

export function CompanySettingsForm({ initial }: { initial: CompanySettingsRecord | null }) {
  const [values, setValues] = useState<CompanySettingsRecord>(
    initial ?? { cashOnHand: null, reserveMinimum: null, committedCapital: null }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const inputClass = "mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm";

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/company-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    if (res.ok) {
      setValues(await res.json());
      setSaved(true);
    }
  }

  return (
    <Card>
      <CardTitle>Company Settings</CardTitle>
      <p className="mt-1 text-sm text-text-secondary">
        This is the only place the CFO capital-position check reads cash facts from -- the app never
        estimates or invents these numbers. Leave a field blank and CFO checks show NEEDS_INFO
        instead of assuming the company can afford everything in the pipeline.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium text-text-secondary">
          Cash on hand
          <input
            type="number"
            value={values.cashOnHand ?? ""}
            onChange={(e) => setValues({ ...values, cashOnHand: e.target.value === "" ? null : Number(e.target.value) })}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-text-secondary">
          Reserve minimum
          <input
            type="number"
            value={values.reserveMinimum ?? ""}
            onChange={(e) => setValues({ ...values, reserveMinimum: e.target.value === "" ? null : Number(e.target.value) })}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-text-secondary">
          Committed capital (already spoken for)
          <input
            type="number"
            value={values.committedCapital ?? ""}
            onChange={(e) => setValues({ ...values, committedCapital: e.target.value === "" ? null : Number(e.target.value) })}
            className={inputClass}
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        {saved && <span className="text-sm text-success">Saved.</span>}
      </div>
    </Card>
  );
}
