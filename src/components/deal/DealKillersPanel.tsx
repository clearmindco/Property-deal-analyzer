"use client";

import type { DealKillerFlag } from "@/lib/types/deal";
import { Card, CardTitle } from "@/components/ui/Card";

const STATUS_STYLES: Record<DealKillerFlag["status"], string> = {
  OK: "text-text-secondary",
  FLAGGED: "text-warning",
  STOP: "text-danger font-semibold",
};

export function DealKillersPanel({
  dealKillers,
  onChange,
  editable = true,
}: {
  dealKillers: DealKillerFlag[];
  onChange?: (next: DealKillerFlag[]) => void;
  editable?: boolean;
}) {
  const stopCount = dealKillers.filter((k) => k.status === "STOP").length;

  function update(key: string, patch: Partial<DealKillerFlag>) {
    if (!onChange) return;
    onChange(dealKillers.map((k) => (k.key === key ? { ...k, ...patch } : k)));
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Deal killers / verify before offering</CardTitle>
        {stopCount > 0 && (
          <span className="rounded-full bg-danger/15 px-3 py-1 text-xs font-bold text-danger">
            STOP -- VERIFY BEFORE OFFERING ({stopCount})
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-col divide-y divide-silver/20">
        {dealKillers.map((k) => (
          <div key={k.key} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className={STATUS_STYLES[k.status]}>{k.label}</span>
            {editable ? (
              <select
                value={k.status}
                onChange={(e) => update(k.key, { status: e.target.value as DealKillerFlag["status"] })}
                className="rounded-card border border-silver/40 bg-canvas px-2 py-1 text-xs"
              >
                <option value="OK">OK</option>
                <option value="FLAGGED">Flagged</option>
                <option value="STOP">Stop</option>
              </select>
            ) : (
              <span className="text-xs">{k.status}</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
