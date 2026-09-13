import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import type { TodayPlan, TodayPlanItem } from "@/lib/ops/chiefOfStaffPlan";
import type { CfoCapitalResult } from "@/lib/ops/cfoCapitalPosition";
import type { CeoBrief } from "@/lib/ops/ceoPriorities";

const BOTTLENECK_LABELS: Record<string, string> = {
  NOT_ENOUGH_LEADS: "Not enough leads",
  FOLLOW_UP_FAILURE: "Follow-up failure",
  SELLERS_NOT_MOVING_TO_CALLS: "Sellers not moving to calls",
  OFFERS_NOT_CONVERTING: "Offers not converting",
  DEALS_FAILING_UNDERWRITING: "Deals failing underwriting",
  CAPITAL_BOTTLENECK: "Capital bottleneck",
  NONE_IDENTIFIED: "No single bottleneck identified",
};

function Section({ title, items, empty }: { title: string; items: TodayPlanItem[]; empty: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{title}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-text-secondary">{empty}</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-1">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-text-primary">
              <span className="font-medium">{item.label}</span>
              {item.detail && <span className="text-text-secondary"> -- {item.detail}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CommandCenter({
  todayPlan, cfoResult, ceoBrief, currentPeriodLabel,
}: {
  todayPlan: TodayPlan;
  cfoResult: CfoCapitalResult;
  ceoBrief: CeoBrief;
  currentPeriodLabel: string;
}) {
  return (
    <Card className="border-navy/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-navy">Good morning, Javier. Here&apos;s what matters today.</CardTitle>
        <span className="rounded-full bg-soft-blue px-3 py-1 text-xs font-semibold text-navy">
          Bottleneck: {BOTTLENECK_LABELS[ceoBrief.bottleneck.label] ?? ceoBrief.bottleneck.label}
        </span>
      </div>
      <p className="mt-1 text-xs text-text-secondary">{ceoBrief.bottleneck.recommendation}</p>

      {(ceoBrief.primaryObjectives.length > 0 || ceoBrief.doNotPrioritize.length > 0) && (
        <div className="mt-3 rounded-card border border-silver/30 bg-canvas p-3 text-sm">
          {ceoBrief.primaryObjectives.map((o, i) => (
            <p key={i}><span className="font-semibold text-navy">Primary objective ({currentPeriodLabel}):</span> {o}</p>
          ))}
          {ceoBrief.secondaryObjectives.map((o, i) => (
            <p key={i} className="mt-1"><span className="font-semibold text-navy">Secondary:</span> {o}</p>
          ))}
          {ceoBrief.doNotPrioritize.map((o, i) => (
            <p key={i} className="mt-1 text-warning"><span className="font-semibold">Do not prioritize:</span> {o}</p>
          ))}
        </div>
      )}

      <div
        className={`mt-3 rounded-card border p-3 text-sm ${
          cfoResult.verdict === "APPROVE"
            ? "border-success/30 bg-success/5"
            : cfoResult.verdict === "DO_NOT_APPROVE_YET"
              ? "border-danger/30 bg-danger/5"
              : "border-warning/30 bg-warning/5"
        }`}
      >
        <p className="font-semibold text-navy">
          CFO capital position: {cfoResult.verdict.replace(/_/g, " ")}
        </p>
        <p className="mt-1 text-text-secondary">{cfoResult.reason}</p>
        {cfoResult.dealsWithUnknownCashRequired > 0 && (
          <p className="mt-1 text-text-secondary">
            {cfoResult.dealsWithUnknownCashRequired} active deal(s) can&apos;t be cash-checked yet -- missing ARV or asking price.
          </p>
        )}
        {cfoResult.verdict === "NEEDS_INFO" && (
          <Link href="/settings/company" className="mt-1 inline-block text-primary-blue hover:underline">
            Enter Company Settings &rarr;
          </Link>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Section title="Urgent" items={todayPlan.urgent} empty="Nothing urgent right now." />
        <Section title="Money moves" items={todayPlan.moneyMoves} empty="No deals need underwriting attention." />
        <Section title="Seller moves" items={todayPlan.sellerMoves} empty="No seller actions on you today." />
        <Section title="Marketing" items={todayPlan.marketing} empty="No marketing items to review." />
        <Section title="Deals" items={todayPlan.deals} empty="No active deals in the pipeline." />
        <Section title="Waiting on others" items={todayPlan.waitingOnOthers} empty="Not waiting on anyone." />
        <Section title="Admin" items={todayPlan.admin} empty="No CRM hygiene issues found." />
      </div>

      <div className="mt-4 border-t border-silver/30 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Top 3 priorities</p>
        {todayPlan.topPriorities.length === 0 ? (
          <p className="mt-1 text-sm text-text-secondary">Nothing scored as a priority yet.</p>
        ) : (
          <ol className="mt-1 flex flex-col gap-1">
            {todayPlan.topPriorities.map((p, i) => (
              <li key={p.id} className="text-sm font-medium text-navy">{i + 1}. {p.label}</li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}
