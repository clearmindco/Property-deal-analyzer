"use client";

import { useState } from "react";
import type { Comparable, ConfidenceStatus, ValueArv } from "@/lib/types/deal";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { InfoTooltip } from "@/components/ui/Tooltip";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useMode } from "@/lib/mode-context";
import { term } from "@/lib/terminology";
import { TabIntro } from "./TabIntro";

const STATUS_OPTIONS: ConfidenceStatus[] = [
  "VERIFIED", "HIGH_CONFIDENCE", "MEDIUM_CONFIDENCE", "LOW_CONFIDENCE", "ASSUMPTION", "NEEDS_INSPECTION", "NEEDS_VERIFICATION",
];

const VALUE_FIELDS: Array<{ key: keyof ValueArv; simple: string; pro: string }> = [
  { key: "asIsValue", simple: "What it's worth today", pro: "As-is value" },
  { key: "conservativeArv", simple: "Value after renovations (conservative)", pro: "Conservative ARV" },
  { key: "likelyArv", simple: "Value after renovations (most likely)", pro: "Likely ARV" },
  { key: "upperArv", simple: "Value after renovations (best case)", pro: "Upper-band ARV" },
  { key: "brrrUnderwritingArv", simple: "Value used for your refinance math", pro: "BRRRR underwriting ARV" },
];

const MATCH_STYLES: Record<Comparable["match"], string> = {
  STRONG: "bg-success/15 text-success",
  MODERATE: "bg-warning/15 text-warning",
  WEAK: "bg-danger/10 text-danger",
  EXCLUDED: "bg-slate/15 text-slate",
};

export function ValueArvTab({
  valueArv,
  onChange,
  onSave,
  saving,
}: {
  valueArv: ValueArv;
  onChange: (next: ValueArv) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const { mode } = useMode();
  const [newComp, setNewComp] = useState<Partial<Comparable>>({ match: "MODERATE" });

  function updateField(key: keyof ValueArv, rawValue: string) {
    const existing = (valueArv[key] as any) ?? { provenance: { status: "ASSUMPTION" } };
    onChange({ ...valueArv, [key]: { ...existing, value: rawValue === "" ? undefined : Number(rawValue) } });
  }

  function updateStatus(key: keyof ValueArv, status: ConfidenceStatus) {
    const existing = (valueArv[key] as any) ?? {};
    onChange({ ...valueArv, [key]: { ...existing, provenance: { ...existing.provenance, status } } });
  }

  function addComparable() {
    if (!newComp.address || !newComp.salePrice) return;
    const comp: Comparable = {
      id: crypto.randomUUID(),
      address: newComp.address,
      salePrice: Number(newComp.salePrice),
      match: newComp.match ?? "MODERATE",
      matchReason: newComp.matchReason ?? "",
      sqft: newComp.sqft ? Number(newComp.sqft) : undefined,
    };
    onChange({ ...valueArv, comparables: [...valueArv.comparables, comp] });
    setNewComp({ match: "MODERATE" });
  }

  function removeComparable(id: string) {
    onChange({ ...valueArv, comparables: valueArv.comparables.filter((c) => c.id !== id) });
  }

  return (
    <div className="flex flex-col gap-6">
      <TabIntro
        blurb="ARV is the single number the rest of this deal hinges on -- it drives your acquisition price, your refinance proceeds, and how much equity you actually create. Back it with real comparable sales, not a guess."
        learnHref="/learn/brrrr-explained"
        learnLabel="Learn how the acquisition-price engine uses this"
      />
      <Card>
        <CardTitle>
          {term("arv", mode)}
          <InfoTooltip text="After Repair Value: the estimated value once planned renovations are complete. Never guaranteed by an appraiser." />
        </CardTitle>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {VALUE_FIELDS.map((f) => {
            const current = (valueArv[f.key] as any) ?? {};
            return (
              <div key={f.key}>
                <label className="text-sm font-medium text-text-secondary">{mode === "simple" ? f.simple : f.pro}</label>
                <input
                  type="number"
                  value={current.value ?? ""}
                  onChange={(e) => updateField(f.key, e.target.value)}
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
        <p className="mt-4 rounded-card bg-soft-blue px-3 py-2 text-xs text-navy">
          The BRRRR underwriting ARV drives your acquisition price and refinance math -- default it to the conservative
          band, not the upper band, especially for a cosmetic/rental-grade renovation.
        </p>
      </Card>

      <Card>
        <CardTitle>Comparable sales</CardTitle>
        <div className="mt-3 flex flex-col gap-2">
          {valueArv.comparables.length === 0 && <p className="text-sm text-text-secondary">No comparables added yet.</p>}
          {valueArv.comparables.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-card border border-silver/30 px-3 py-2 text-sm">
              <div>
                <span className={`mr-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${MATCH_STYLES[c.match]}`}>{c.match}</span>
                <span className="font-medium">{c.address}</span> -- ${Math.round(c.salePrice).toLocaleString()}
                {c.matchReason && <p className="mt-1 text-xs text-text-secondary">{c.matchReason}</p>}
              </div>
              <button onClick={() => removeComparable(c.id)} className="text-xs text-danger">Remove</button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <input placeholder="Address" value={newComp.address ?? ""} onChange={(e) => setNewComp((c) => ({ ...c, address: e.target.value }))} className="col-span-2 rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm" />
          <input placeholder="Sale price" type="number" value={newComp.salePrice ?? ""} onChange={(e) => setNewComp((c) => ({ ...c, salePrice: Number(e.target.value) }))} className="rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm" />
          <select value={newComp.match} onChange={(e) => setNewComp((c) => ({ ...c, match: e.target.value as Comparable["match"] }))} className="rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm">
            <option value="STRONG">Strong comp</option>
            <option value="MODERATE">Moderate comp</option>
            <option value="WEAK">Weak comp</option>
            <option value="EXCLUDED">Excluded</option>
          </select>
          <Button onClick={addComparable}>Add</Button>
          <input placeholder="Why this match/exclusion?" value={newComp.matchReason ?? ""} onChange={(e) => setNewComp((c) => ({ ...c, matchReason: e.target.value }))} className="col-span-5 rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm" />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save value / ARV"}</Button>
      </div>
    </div>
  );
}
