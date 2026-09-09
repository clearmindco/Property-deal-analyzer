import type { DecisionVerdict } from "@/lib/calc/decision";
import type { StressVerdict } from "@/lib/calc/stressTest";

const decisionStyles: Record<DecisionVerdict, { icon: string; label: string; classes: string }> = {
  STRONG_FIT: { icon: "✓", label: "STRONG FIT", classes: "bg-success/15 text-success border-success/40" },
  NEEDS_WORK: { icon: "!", label: "NEEDS WORK", classes: "bg-warning/15 text-warning border-warning/40" },
  DOESNT_FIT: { icon: "×", label: "DOESN'T FIT", classes: "bg-danger/15 text-danger border-danger/40" },
};

const stressStyles: Record<StressVerdict, { icon: string; classes: string }> = {
  SURVIVES: { icon: "✓", classes: "bg-success/15 text-success border-success/40" },
  TIGHT: { icon: "!", classes: "bg-warning/15 text-warning border-warning/40" },
  FAILS: { icon: "×", classes: "bg-danger/15 text-danger border-danger/40" },
};

export function DecisionPill({ verdict }: { verdict: DecisionVerdict }) {
  const s = decisionStyles[verdict];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${s.classes}`}>
      <span aria-hidden>{s.icon}</span>
      {s.label}
    </span>
  );
}

export function StressPill({ verdict }: { verdict: StressVerdict }) {
  const s = stressStyles[verdict];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${s.classes}`}>
      <span aria-hidden>{s.icon}</span>
      {verdict}
    </span>
  );
}
