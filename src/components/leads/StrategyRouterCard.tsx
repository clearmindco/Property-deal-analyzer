"use client";

import { Card, CardTitle } from "@/components/ui/Card";
import { InfoTooltip } from "@/components/ui/Tooltip";
import { STRATEGY_LANE_LABELS, type StrategyRouterResult } from "@/lib/types/leadgen";

const LANE_STYLES: Record<string, string> = {
  PASS: "bg-slate/15 text-slate",
  FOLLOW_UP: "bg-warning/15 text-warning",
};

export function StrategyRouterCard({ result }: { result: StrategyRouterResult }) {
  return (
    <Card>
      <CardTitle>
        Strategy router
        <InfoTooltip text="Understand the seller's situation before structuring anything. Not every lead is a deal -- PASS is a successful outcome when the economics or risk don't work." />
      </CardTitle>

      {result.needsMoreInfo && (
        <p className="mt-1 text-xs text-text-secondary">
          Still gathering information -- this will sharpen as you answer more of the core questions.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {result.recommended.map((lane) => (
          <span key={lane} className={`rounded-full px-3 py-1 text-xs font-medium ${LANE_STYLES[lane] ?? "bg-soft-blue text-navy"}`}>
            {STRATEGY_LANE_LABELS[lane]}
          </span>
        ))}
      </div>

      {result.reasoning.length > 0 && (
        <ul className="mt-3 list-disc pl-5 text-sm text-text-primary">
          {result.reasoning.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      )}

      <p className="mt-3 text-xs text-text-secondary">
        This never automatically picks creative financing -- it only appears when the seller has actually responded
        to the terms question, and always alongside the cash numbers.
      </p>
    </Card>
  );
}
