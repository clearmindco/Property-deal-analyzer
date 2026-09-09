import type { ConfidenceStatus } from "@/lib/types/deal";

const labels: Record<ConfidenceStatus, string> = {
  VERIFIED: "Verified",
  HIGH_CONFIDENCE: "High confidence",
  MEDIUM_CONFIDENCE: "Medium confidence",
  LOW_CONFIDENCE: "Low confidence",
  ASSUMPTION: "Assumption",
  NEEDS_INSPECTION: "Needs inspection",
  NEEDS_VERIFICATION: "Needs verification",
};

const classes: Record<ConfidenceStatus, string> = {
  VERIFIED: "bg-success/15 text-success border-success/40",
  HIGH_CONFIDENCE: "bg-success/10 text-success border-success/30",
  MEDIUM_CONFIDENCE: "bg-warning/15 text-warning border-warning/40",
  LOW_CONFIDENCE: "bg-warning/15 text-warning border-warning/40",
  ASSUMPTION: "bg-slate/15 text-slate border-slate/40",
  NEEDS_INSPECTION: "bg-danger/10 text-danger border-danger/30",
  NEEDS_VERIFICATION: "bg-danger/10 text-danger border-danger/30",
};

export function ConfidenceBadge({ status, source }: { status: ConfidenceStatus; source?: string }) {
  return (
    <span
      title={source ? `Source: ${source}` : undefined}
      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${classes[status]}`}
    >
      {labels[status]}
    </span>
  );
}
