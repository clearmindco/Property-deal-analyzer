"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface GeneratedDocumentView {
  id: string;
  documentKey: string;
  documentName: string;
  status: string;
  executedAt: string | null;
  attorneyReviewStatus: string;
  body: string;
}

const STATUS_FLOW: Record<string, string | null> = {
  DRAFT: "UNDER_REVIEW",
  UNDER_REVIEW: "APPROVED",
  APPROVED: "EXECUTED",
  EXECUTED: null,
  VOID: null,
};

export function GeneratedDocumentsPanel({ legalCaseId, gated }: { legalCaseId: string; gated: boolean }) {
  const [docs, setDocs] = useState<GeneratedDocumentView[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/legal-cases/${legalCaseId}/documents`);
    if (res.ok) setDocs(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legalCaseId]);

  async function generate() {
    setGenerating(true);
    setError(null);
    const res = await fetch(`/api/legal-cases/${legalCaseId}/documents`, { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not generate documents.");
    } else {
      await load();
    }
    setGenerating(false);
  }

  async function transition(id: string, status: string) {
    await fetch(`/api/generated-documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>Draft documents (attorney intake worksheets)</CardTitle>
        {!gated && (
          <Button onClick={generate} disabled={generating}>{generating ? "Generating..." : "Generate draft documents"}</Button>
        )}
      </div>
      <p className="mt-2 text-xs text-text-secondary">
        Every document below is a placeholder worksheet, not a usable contract -- it hands an attorney the facts
        already captured in this app so they can draft the real document. Nothing here should be shown to a
        seller or signed.
      </p>
      {gated && (
        <p className="mt-2 text-sm font-semibold text-danger">
          Document generation is disabled while this case is on the distressed-property legal hold. Route it to
          an attorney instead of generating a placeholder.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {docs && docs.length === 0 && !gated && (
        <p className="mt-3 text-sm text-text-secondary">No draft documents generated yet.</p>
      )}

      <ul className="mt-3 flex flex-col gap-2">
        {docs?.map((doc) => {
          const nextStatus = STATUS_FLOW[doc.status];
          const terminal = doc.status === "EXECUTED" || doc.status === "VOID";
          return (
            <li key={doc.id} className="rounded-card border border-silver/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-navy">{doc.documentName}</p>
                  <p className="text-xs text-text-secondary">
                    Status: {doc.status.replace(/_/g, " ").toLowerCase()} -- Attorney review: {doc.attorneyReviewStatus.replace(/_/g, " ").toLowerCase()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}>
                    {expandedId === doc.id ? "Hide" : "View"}
                  </Button>
                  {nextStatus && (
                    <Button variant="secondary" onClick={() => transition(doc.id, nextStatus)}>
                      Mark {nextStatus.replace(/_/g, " ").toLowerCase()}
                    </Button>
                  )}
                  {!terminal && (
                    <Button variant="danger" onClick={() => transition(doc.id, "VOID")}>Void</Button>
                  )}
                </div>
              </div>
              {expandedId === doc.id && (
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-card bg-canvas p-3 text-xs text-text-primary">
                  {doc.body}
                </pre>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
