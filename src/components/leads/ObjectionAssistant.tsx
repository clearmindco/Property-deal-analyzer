"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { listObjections, matchObjection } from "@/lib/leadgen";
import type { ObjectionEntry } from "@/lib/types/leadgen";

export function ObjectionAssistant() {
  const objections = listObjections();
  const [pastedText, setPastedText] = useState("");
  const [selected, setSelected] = useState<ObjectionEntry | null>(null);
  const [noMatch, setNoMatch] = useState(false);

  function findMatch() {
    const match = matchObjection(pastedText);
    setSelected(match);
    setNoMatch(!match);
  }

  function pickManually(key: string) {
    setNoMatch(false);
    setSelected(objections.find((o) => o.key === key) ?? null);
  }

  return (
    <Card>
      <CardTitle>Objection assistant</CardTitle>
      <p className="mt-1 text-xs text-text-secondary">
        The rule: diagnose the objection and understand what the seller actually needs --
        don&apos;t &quot;overcome&quot; them. Paste what they said, or just pick the objection below.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Paste the seller's pushback here..."
          className="flex-1 rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm"
        />
        <Button variant="secondary" onClick={findMatch}>Match objection</Button>
      </div>

      <select
        onChange={(e) => e.target.value && pickManually(e.target.value)}
        value={selected?.key ?? ""}
        className="mt-2 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm"
      >
        <option value="">-- Or pick a common objection --</option>
        {objections.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>

      {noMatch && (
        <p className="mt-2 text-sm text-text-secondary">
          Didn&apos;t recognize that one automatically -- pick the closest match from the list above.
        </p>
      )}

      {selected && (
        <div className="mt-3 rounded-card border border-primary-blue/40 bg-soft-blue p-3 text-sm">
          <p className="text-xs font-semibold uppercase text-text-secondary">Suggested response</p>
          <p className="mt-1 text-navy">{selected.suggestedResponse}</p>
          <button
            onClick={() => navigator.clipboard.writeText(selected.suggestedResponse).catch(() => {})}
            className="mt-2 text-xs font-medium text-primary-blue"
          >
            Copy response
          </button>
          <p className="mt-3 text-xs font-semibold uppercase text-text-secondary">Why this response</p>
          <p className="mt-1 text-xs text-text-secondary">{selected.purpose}</p>
        </div>
      )}
    </Card>
  );
}
