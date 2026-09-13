"use client";

import { useEffect, useState } from "react";
import { getAiProvider } from "@/lib/ai/provider";
import type { AiDealSummaryOutput, DealSummaryContext } from "@/lib/ai/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useMode } from "@/lib/mode-context";
import { DealSourceCard, type SourceState } from "./DealSourceCard";

interface HeaderState {
  address: string; city: string; state: string; zip: string;
  askingPrice: string; propertyType: string; units: string; bedrooms: string; bathrooms: string; sqft: string;
}

export function OverviewTab({
  header,
  onHeaderChange,
  onSave,
  saving,
  summaryContext,
  source,
  onSourceChange,
  onSourceSave,
}: {
  header: HeaderState;
  onHeaderChange: (next: HeaderState) => void;
  onSave: () => void;
  saving: boolean;
  summaryContext: DealSummaryContext;
  source: SourceState;
  onSourceChange: (next: SourceState) => void;
  onSourceSave: () => void;
}) {
  const { mode } = useMode();
  const [summary, setSummary] = useState<AiDealSummaryOutput | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAiProvider().generateDealSummary(summaryContext).then((result) => {
      if (!cancelled) setSummary(result);
    });
    return () => { cancelled = true; };
    // Deliberately depend on a serialized snapshot: summaryContext is a fresh object every
    // render, so comparing by reference would re-run this on every keystroke elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(summaryContext)]);

  const inputClass = "mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm";
  const labelClass = "text-sm font-medium text-text-secondary";

  return (
    <div className="flex flex-col gap-6">
      {mode === "simple" && (
        <Card className="border-primary-blue/40 bg-soft-blue">
          <CardTitle className="text-navy">How to work this deal</CardTitle>
          <ol className="mt-3 grid grid-cols-1 gap-2 text-sm text-navy sm:grid-cols-3">
            <li><strong>1. Property</strong> -- what you know about its condition</li>
            <li><strong>2. Value / ARV</strong> -- what it&apos;s worth now and after repairs</li>
            <li><strong>3. Rehab</strong> -- what repairs might cost</li>
            <li><strong>4. Rent</strong> -- what it could rent for</li>
            <li><strong>5. Financing</strong> -- how you&apos;d pay for it</li>
            <li><strong>6. Decision</strong> -- the price to pay and what to do next</li>
          </ol>
          <p className="mt-3 text-xs text-text-secondary">
            Work through the tabs above in that order. Every number has a &quot;?&quot; you can tap for a
            plain-English explanation, and nothing here is a guarantee -- it&apos;s a calculator, not a crystal ball.
          </p>
        </Card>
      )}

      <Card>
        <CardTitle>Deal basics</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className={`${labelClass} col-span-2`}>Address
            <input value={header.address} onChange={(e) => onHeaderChange({ ...header, address: e.target.value })} className={inputClass} />
          </label>
          <label className={labelClass}>City
            <input value={header.city} onChange={(e) => onHeaderChange({ ...header, city: e.target.value })} className={inputClass} />
          </label>
          <label className={labelClass}>State
            <input value={header.state} onChange={(e) => onHeaderChange({ ...header, state: e.target.value })} className={inputClass} />
          </label>
          <label className={labelClass}>Asking price ($)
            <input type="number" value={header.askingPrice} onChange={(e) => onHeaderChange({ ...header, askingPrice: e.target.value })} className={inputClass} />
          </label>
          <label className={labelClass}>Units
            <input type="number" value={header.units} onChange={(e) => onHeaderChange({ ...header, units: e.target.value })} className={inputClass} />
          </label>
          <label className={labelClass}>Bedrooms
            <input type="number" value={header.bedrooms} onChange={(e) => onHeaderChange({ ...header, bedrooms: e.target.value })} className={inputClass} />
          </label>
          <label className={labelClass}>Bathrooms
            <input type="number" step="0.5" value={header.bathrooms} onChange={(e) => onHeaderChange({ ...header, bathrooms: e.target.value })} className={inputClass} />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save deal basics"}</Button>
        </div>
      </Card>

      <DealSourceCard source={source} onChange={onSourceChange} onSave={onSourceSave} saving={saving} />

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>{mode === "simple" ? "What this deal looks like so far" : "AI deal summary"}</CardTitle>
          <span className="text-[11px] text-text-secondary">
            {summary ? `Generated by ${summary.generatedBy} provider` : "Generating..."}
          </span>
        </div>
        {summary && (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummarySection title="What we know" items={summary.whatWeKnow} />
            <SummarySection title="What looks good" items={summary.whatLooksGood} />
            <SummarySection title="What concerns us" items={summary.whatConcernsUs} />
            <SummarySection title="What could kill the deal" items={summary.whatCouldKillTheDeal} />
            <div className="sm:col-span-2 rounded-card bg-soft-blue p-4 text-sm text-navy">
              <p>{summary.priceRecommendation}</p>
              <p className="mt-2">{summary.financingRecommendation}</p>
              <p className="mt-2">{summary.exitStrategyRecommendation}</p>
            </div>
            <SummarySection title="Next steps" items={summary.nextSteps} className="sm:col-span-2" />
          </div>
        )}
      </Card>
    </div>
  );
}

function SummarySection({ title, items, className = "" }: { title: string; items: string[]; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase text-text-secondary">{title}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-text-secondary">Nothing yet.</p>
      ) : (
        <ul className="mt-1 list-disc pl-5 text-sm text-text-primary">
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}
    </div>
  );
}
