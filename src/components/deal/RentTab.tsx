"use client";

import type { ConfidenceStatus, Rent } from "@/lib/types/deal";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useMode } from "@/lib/mode-context";

const STATUS_OPTIONS: ConfidenceStatus[] = [
  "VERIFIED", "HIGH_CONFIDENCE", "MEDIUM_CONFIDENCE", "LOW_CONFIDENCE", "ASSUMPTION", "NEEDS_INSPECTION", "NEEDS_VERIFICATION",
];

const RENT_FIELDS = [
  { key: "conservativeRent", simple: "Rent (worst case)", pro: "Conservative rent" },
  { key: "likelyRent", simple: "Rent (most likely)", pro: "Likely market rent" },
  { key: "upperRent", simple: "Rent (best case)", pro: "Upper-band rent" },
] as const;

export function RentTab({
  rent,
  onChange,
  onSave,
  saving,
}: {
  rent: Rent;
  onChange: (next: Rent) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const { mode } = useMode();

  function updateMarket(key: (typeof RENT_FIELDS)[number]["key"], raw: string) {
    const existing = (rent.market[key] as any) ?? { provenance: { status: "ASSUMPTION" } };
    onChange({ ...rent, market: { ...rent.market, [key]: { ...existing, value: raw === "" ? undefined : Number(raw) } } });
  }

  function updateStatus(key: (typeof RENT_FIELDS)[number]["key"], status: ConfidenceStatus) {
    const existing = (rent.market[key] as any) ?? {};
    onChange({ ...rent, market: { ...rent.market, [key]: { ...existing, provenance: { ...existing.provenance, status } } } });
  }

  const section8 = rent.section8 ?? {};

  function updateSection8Number(field: string, raw: string) {
    const existing = (section8 as any)[field] ?? { provenance: { status: "ASSUMPTION" } };
    onChange({ ...rent, section8: { ...section8, [field]: { ...existing, value: raw === "" ? undefined : Number(raw) } } });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardTitle>Market rent</CardTitle>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {RENT_FIELDS.map((f) => {
            const current = (rent.market[f.key] as any) ?? {};
            return (
              <div key={f.key}>
                <label className="text-sm font-medium text-text-secondary">{mode === "simple" ? f.simple : f.pro}</label>
                <input
                  type="number"
                  value={current.value ?? ""}
                  onChange={(e) => updateMarket(f.key, e.target.value)}
                  className="mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm"
                />
                <div className="mt-1 flex items-center gap-2">
                  <select
                    value={current.provenance?.status ?? "ASSUMPTION"}
                    onChange={(e) => updateStatus(f.key, e.target.value as ConfidenceStatus)}
                    className="rounded-card border border-silver/40 bg-canvas px-2 py-1 text-[11px] text-text-secondary"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                  {current.provenance?.status && <ConfidenceBadge status={current.provenance.status} />}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-text-secondary">
          BRRRR underwriting should not automatically use the highest (best-case) rent band.
        </p>
      </Card>

      <Card>
        <CardTitle>Section 8 / Housing Choice Voucher</CardTitle>
        <p className="mt-1 text-xs text-text-secondary">
          Payment standards are configurable per housing authority and are not yet loaded for this ZIP.
          A payment standard is <strong>not</strong> a guaranteed landlord rent -- the tenant/HAP split depends on household circumstances.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-text-secondary">Payment standard ($)</label>
            <input type="number" value={(section8 as any).paymentStandard?.value ?? ""} onChange={(e) => updateSection8Number("paymentStandard", e.target.value)} className="mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">Estimated utility allowance ($)</label>
            <input type="number" value={(section8 as any).utilityAllowance?.value ?? ""} onChange={(e) => updateSection8Number("utilityAllowance", e.target.value)} className="mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">Estimated contract-rent ceiling ($)</label>
            <input type="number" value={(section8 as any).contractRentCeiling?.value ?? ""} onChange={(e) => updateSection8Number("contractRentCeiling", e.target.value)} className="mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">Recommended asking rent ($)</label>
            <input type="number" value={(section8 as any).recommendedAskingRent?.value ?? ""} onChange={(e) => updateSection8Number("recommendedAskingRent", e.target.value)} className="mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm" />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save rent analysis"}</Button>
      </div>
    </div>
  );
}
