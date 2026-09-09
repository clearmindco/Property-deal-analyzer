"use client";

import { useState } from "react";
import type { PropertyDetails, ConfidenceStatus } from "@/lib/types/deal";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { useMode } from "@/lib/mode-context";
import { getAiProvider } from "@/lib/ai/provider";
import type { StructuredVoiceField } from "@/lib/ai/types";

const STATUS_OPTIONS: ConfidenceStatus[] = [
  "VERIFIED", "HIGH_CONFIDENCE", "MEDIUM_CONFIDENCE", "LOW_CONFIDENCE",
  "ASSUMPTION", "NEEDS_INSPECTION", "NEEDS_VERIFICATION",
];

interface FieldSpec {
  key: keyof PropertyDetails;
  label: { simple: string; pro: string };
  type: "number" | "select";
  options?: string[];
}

const FIELDS: FieldSpec[] = [
  { key: "roofAgeYears", label: { simple: "How old is the roof? (years)", pro: "Roof age (years)" }, type: "number" },
  { key: "furnaceAgeYears", label: { simple: "How old is the furnace? (years)", pro: "Furnace age (years)" }, type: "number" },
  { key: "waterHeaterAgeYears", label: { simple: "How old is the water heater? (years)", pro: "Water heater age (years)" }, type: "number" },
  { key: "electricalPanelAgeYears", label: { simple: "How old is the electrical panel? (years)", pro: "Electrical panel age (years)" }, type: "number" },
  { key: "annualTaxes", label: { simple: "Yearly property taxes ($)", pro: "Annual taxes ($)" }, type: "number" },
  { key: "occupancyAtClosing", label: { simple: "Will it be empty when you close?", pro: "Occupancy at closing" }, type: "select", options: ["VACANT", "OCCUPIED", "UNKNOWN"] },
  { key: "certificateOfOccupancy", label: { simple: "Does it have a legal occupancy certificate?", pro: "Certificate of Occupancy" }, type: "select", options: ["YES", "NO", "UNKNOWN"] },
  { key: "sewerType", label: { simple: "City sewer or septic?", pro: "Sewer type" }, type: "select", options: ["CITY", "SEPTIC", "UNKNOWN"] },
];

export function PropertyTab({
  property,
  onChange,
  onSave,
  saving,
  voiceNote,
  onVoiceNoteChange,
}: {
  property: PropertyDetails;
  onChange: (next: PropertyDetails) => void;
  onSave: () => void;
  saving: boolean;
  voiceNote: string;
  onVoiceNoteChange: (v: string) => void;
}) {
  const { mode } = useMode();
  const [suggestions, setSuggestions] = useState<StructuredVoiceField[]>([]);

  async function suggestFields() {
    if (!voiceNote.trim()) return;
    const result = await getAiProvider().structureVoiceNote(voiceNote);
    setSuggestions(result);
  }

  function confirmSuggestion(s: StructuredVoiceField) {
    const existing = (property[s.field as keyof PropertyDetails] as any) ?? {};
    onChange({
      ...property,
      [s.field]: { ...existing, value: s.value, provenance: { status: "NEEDS_VERIFICATION", source: "Voice note (seller-reported)", note: "Confirmed from a voice/text note; still needs independent verification." } },
    });
    setSuggestions((prev) => prev.filter((p) => p.field !== s.field));
  }

  function dismissSuggestion(s: StructuredVoiceField) {
    setSuggestions((prev) => prev.filter((p) => p.field !== s.field));
  }

  function updateValue(key: keyof PropertyDetails, rawValue: string) {
    const existing = (property[key] as any) ?? { provenance: { status: "ASSUMPTION" } };
    const field = FIELDS.find((f) => f.key === key)!;
    const value = field.type === "number" ? (rawValue === "" ? undefined : Number(rawValue)) : rawValue;
    onChange({ ...property, [key]: { ...existing, value } });
  }

  function updateStatus(key: keyof PropertyDetails, status: ConfidenceStatus) {
    const existing = (property[key] as any) ?? { value: undefined };
    onChange({ ...property, [key]: { ...existing, provenance: { ...existing.provenance, status } } });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardTitle>Seller / contractor notes (voice or text)</CardTitle>
        <p className="mb-2 mt-1 text-xs text-text-secondary">
          Tap the microphone and describe the property in plain language. You&apos;ll confirm any suggested fields before they become verified data.
        </p>
        <VoiceInput value={voiceNote} onChange={onVoiceNoteChange} placeholder="e.g. Roof is six years old, furnace and water heater are about three years old..." />
        <div className="mt-2 flex justify-end">
          <Button variant="secondary" onClick={suggestFields}>Suggest fields from this note</Button>
        </div>
        {suggestions.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {suggestions.map((s) => (
              <div key={s.field} className="flex items-center justify-between rounded-card border border-primary-blue/40 bg-soft-blue px-3 py-2 text-sm">
                <span><strong>{s.field}</strong>: {String(s.value)}</span>
                <div className="flex gap-2">
                  <button onClick={() => confirmSuggestion(s)} className="text-xs font-medium text-primary-blue">Confirm</button>
                  <button onClick={() => dismissSuggestion(s)} className="text-xs text-text-secondary">Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Property condition</CardTitle>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => {
            const current = (property[field.key] as any) ?? {};
            return (
              <div key={field.key}>
                <label className="text-sm font-medium text-text-secondary">
                  {mode === "simple" ? field.label.simple : field.label.pro}
                </label>
                {field.type === "select" ? (
                  <select
                    value={current.value ?? ""}
                    onChange={(e) => updateValue(field.key, e.target.value)}
                    className="mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm"
                  >
                    <option value="">-- Unknown --</option>
                    {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={current.value ?? ""}
                    onChange={(e) => updateValue(field.key, e.target.value)}
                    className="mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm"
                  />
                )}
                <div className="mt-1 flex items-center gap-2">
                  <select
                    value={current.provenance?.status ?? "ASSUMPTION"}
                    onChange={(e) => updateStatus(field.key, e.target.value as ConfidenceStatus)}
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
        <div className="mt-4 flex justify-end">
          <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save property details"}</Button>
        </div>
      </Card>
    </div>
  );
}
