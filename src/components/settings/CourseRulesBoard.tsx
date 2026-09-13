"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface CourseRuleRecord {
  id: string;
  key: string;
  sourceLabel: string;
  ruleText: string;
  details: string[] | null;
  status: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  NEEDS_CLARIFICATION: "bg-warning/15 text-warning",
  AUTHORITATIVE: "bg-success/15 text-success",
  SUPERSEDED: "bg-silver/30 text-text-secondary",
};

export function CourseRulesBoard({ initial }: { initial: CourseRuleRecord[] }) {
  const [rows, setRows] = useState(initial);

  const byKey = new Map<string, CourseRuleRecord[]>();
  for (const row of rows) {
    byKey.set(row.key, [...(byKey.get(row.key) ?? []), row]);
  }

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/course-rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {[...byKey.entries()].map(([key, versions]) => (
        <Card key={key}>
          <CardTitle>{key.replace(/_/g, " ")}</CardTitle>
          {versions.length > 1 && (
            <p className="mt-1 text-xs text-warning">
              {versions.filter((v) => v.status !== "SUPERSEDED").length} documented version(s) currently coexist here --
              nothing is math-reconciled or silently picked as correct.
            </p>
          )}
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {versions.map((v) => (
              <div key={v.id} className="rounded-card border border-silver/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-navy">{v.sourceLabel}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[v.status] ?? ""}`}>
                    {v.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-primary">&ldquo;{v.ruleText}&rdquo;</p>
                {v.details && v.details.length > 0 && (
                  <ul className="mt-2 list-disc pl-4 text-xs text-text-secondary">
                    {v.details.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                )}
                {v.status !== "AUTHORITATIVE" && (
                  <Button variant="secondary" className="mt-2" onClick={() => setStatus(v.id, "AUTHORITATIVE")}>
                    Mark authoritative
                  </Button>
                )}
                {v.status !== "SUPERSEDED" && (
                  <Button variant="secondary" className="ml-2 mt-2" onClick={() => setStatus(v.id, "SUPERSEDED")}>
                    Mark superseded
                  </Button>
                )}
                {v.status !== "NEEDS_CLARIFICATION" && (
                  <Button variant="secondary" className="ml-2 mt-2" onClick={() => setStatus(v.id, "NEEDS_CLARIFICATION")}>
                    Reopen
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
      {rows.length === 0 && (
        <Card>
          <p className="text-sm text-text-secondary">No course rules stored yet.</p>
        </Card>
      )}
    </div>
  );
}
