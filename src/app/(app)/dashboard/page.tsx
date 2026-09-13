import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fetchOnboardingInputs } from "@/lib/onboarding/fetchOnboardingInputs";
import { computeOnboardingProgress } from "@/lib/onboarding/computeOnboardingProgress";
import { DEAL_JSON_FIELDS, COURSE_RULE_JSON_FIELDS, deserializeJsonFields } from "@/lib/jsonFields";
import { buildTodayPlan, type TodayPlanItem } from "@/lib/ops/chiefOfStaffPlan";
import { evaluateCapitalPosition } from "@/lib/ops/cfoCapitalPosition";
import { summarizeAcquisitionsPipeline } from "@/lib/ops/acquisitionsPipeline";
import { findDealsNeedingUnderwriting } from "@/lib/ops/underwritingQueue";
import { summarizeMarketingToday } from "@/lib/ops/cmoMarketingToday";
import { detectBottleneck } from "@/lib/ops/bottleneck";
import { buildCeoBrief } from "@/lib/ops/ceoPriorities";
import { CommandCenter } from "@/components/dashboard/CommandCenter";

// ISO 8601 week label (e.g. "2026-W38") -- presentation-only formatting, not a shared engine.
function isoWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const userId = await requireUserId();
  const now = new Date();

  const [dealsRaw, leadsRaw, groups, posts, onboardingInputs, companySettings, courseRulesRaw, companyObjectivesRaw] =
    await Promise.all([
      prisma.deal.findMany({ where: { userId } }),
      prisma.lead.findMany({ where: { userId } }),
      prisma.group.findMany({ where: { userId } }),
      prisma.post.findMany({ where: { userId } }),
      fetchOnboardingInputs(userId),
      prisma.companySettings.findUnique({ where: { userId } }),
      prisma.courseRule.findMany({ where: { userId } }),
      prisma.companyObjective.findMany({ where: { userId } }),
    ]);
  const dealCount = dealsRaw.length;
  const leadCount = leadsRaw.length;
  const lenderCount = await prisma.lender.count({ where: { userId } });
  const onboardingProgress = computeOnboardingProgress(onboardingInputs);

  const deals = dealsRaw.map((d) => deserializeJsonFields(JSON.parse(JSON.stringify(d)), DEAL_JSON_FIELDS));
  const leads = leadsRaw.map((l) => JSON.parse(JSON.stringify(l)));
  const courseRules = courseRulesRaw.map((r) => deserializeJsonFields(JSON.parse(JSON.stringify(r)), COURSE_RULE_JSON_FIELDS));

  // Marketing: mirror the aggregation already used on the AI Mentor page (mentor/page.tsx) --
  // posted count, response count, and leads-per-group -- rather than inventing a second method.
  const postsByGroup = new Map<string, typeof posts>();
  for (const post of posts) {
    postsByGroup.set(post.groupId, [...(postsByGroup.get(post.groupId) ?? []), post]);
  }
  const leadsByGroup = new Map<string, number>();
  for (const lead of leadsRaw) {
    if (lead.groupId) leadsByGroup.set(lead.groupId, (leadsByGroup.get(lead.groupId) ?? 0) + 1);
  }
  const marketingGroups = groups.map((group) => {
    const groupPosts = postsByGroup.get(group.id) ?? [];
    return {
      id: group.id,
      name: group.name,
      priority: group.priority,
      dateJoined: group.dateJoined,
      counts: {
        posts: groupPosts.filter((p) => p.status === "POSTED").length,
        responses: groupPosts.filter((p) => p.responseOutcome && p.responseOutcome !== "NONE").length,
        leads: leadsByGroup.get(group.id) ?? 0,
        qualifiedLeads: 0, calls: 0, offers: 0, contracts: 0, closedDeals: 0,
      },
    };
  });
  const marketingSummary = summarizeMarketingToday(marketingGroups, courseRules);
  const marketingItems: TodayPlanItem[] = [
    ...(marketingSummary.groupsPerformingWell.length > 0
      ? [{ label: `${marketingSummary.groupsPerformingWell.length} group(s) performing well`, detail: marketingSummary.groupsPerformingWell.join(", ") }]
      : []),
    ...(marketingSummary.groupsToStop.length > 0
      ? [{ label: `${marketingSummary.groupsToStop.length} group(s) to stop using`, detail: marketingSummary.groupsToStop.join(", ") }]
      : []),
    { label: "Blue Ad readiness", detail: marketingSummary.blueAdReadiness.reason },
  ];

  const cfoResult = evaluateCapitalPosition(
    deals.map((d) => ({
      id: d.id, address: d.address, stage: d.stage, askingPrice: d.askingPrice,
      valueArv: d.valueArv, rehab: d.rehab, hardMoney: d.financing.hardMoney, holdPeriodMonths: d.financing.holdPeriodMonths,
    })),
    companySettings
  );

  const pipeline = summarizeAcquisitionsPipeline(
    leads.map((l) => ({ id: l.id, sellerName: l.sellerName, status: l.status, leadType: l.leadType, lastContactAt: l.lastContactAt, nextFollowUpAt: l.nextFollowUpAt })),
    now
  );
  const dealsNeedingUnderwriting = findDealsNeedingUnderwriting(
    deals.map((d) => ({ id: d.id, address: d.address, stage: d.stage, dealKillers: d.dealKillers, valueArv: d.valueArv, rehab: d.rehab, rent: d.rent }))
  );

  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
  const newLeadsThisWeek = leadsRaw.filter((l) => l.createdAt >= sevenDaysAgo).length;
  const callsScheduled = leadsRaw.filter((l) => l.status === "CALL_SCHEDULED").length;
  const callsCompleted = leadsRaw.filter((l) => ["ANALYZING", "OFFER", "FOLLOW_UP", "UNDER_CONTRACT", "CLOSED"].includes(l.status)).length;
  const offersCount = leadsRaw.filter((l) => l.status === "OFFER").length;
  const contractsCount = leadsRaw.filter((l) => l.status === "UNDER_CONTRACT").length;

  const bottleneck = detectBottleneck({
    newLeadsThisWeek,
    staleActiveConversations: pipeline.staleActiveConversations.length,
    overdueFollowUps: pipeline.overdueFollowUps.length,
    callsScheduled, callsCompleted, offersCount, contractsCount,
    dealsNeedingUnderwriting: dealsNeedingUnderwriting.length,
    cfoVerdict: cfoResult.verdict,
  });

  const currentPeriodLabel = isoWeekLabel(now);
  const ceoBrief = buildCeoBrief(companyObjectivesRaw, currentPeriodLabel, bottleneck);

  const todayPlan = buildTodayPlan(
    deals.map((d) => ({
      id: d.id, address: d.address, stage: d.stage, nextAction: d.nextAction, nextActionOwner: d.nextActionOwner,
      nextContactMethod: d.nextContactMethod, followUpCadence: d.followUpCadence, dealKillers: d.dealKillers,
      valueArv: d.valueArv, rehab: d.rehab, rent: d.rent,
    })),
    leads.map((l) => ({
      id: l.id, sellerName: l.sellerName, status: l.status, leadType: l.leadType, nextAction: l.nextAction,
      nextActionOwner: l.nextActionOwner, nextContactMethod: l.nextContactMethod,
      nextFollowUpAt: l.nextFollowUpAt, lastContactAt: l.lastContactAt,
    })),
    marketingItems,
    now
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
          <p className="text-text-secondary">From address to answer. Understand the deal. Know the risk. Know your next move.</p>
        </div>
        <Link href="/deals/new">
          <Button>+ New Deal</Button>
        </Link>
      </div>

      {!onboardingProgress.allDone && (
        <Card className="border-primary-blue/40 bg-soft-blue/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-navy">New here? Start with your first deal.</CardTitle>
              <p className="mt-1 text-sm text-text-primary">
                {onboardingProgress.nextStep
                  ? `Next: ${onboardingProgress.nextStep.title}`
                  : "You're almost through the guided walkthrough."}{" "}
                ({onboardingProgress.percentComplete}% of the way through the required steps)
              </p>
            </div>
            <Link href="/getting-started">
              <Button>Continue walkthrough</Button>
            </Link>
          </div>
        </Card>
      )}

      <CommandCenter todayPlan={todayPlan} cfoResult={cfoResult} ceoBrief={ceoBrief} currentPeriodLabel={currentPeriodLabel} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardTitle>Deals</CardTitle>
          <p className="mt-2 text-3xl font-bold text-navy">{dealCount}</p>
        </Card>
        <Card>
          <CardTitle>Seller leads</CardTitle>
          <p className="mt-2 text-3xl font-bold text-navy">{leadCount}</p>
        </Card>
        <Card>
          <CardTitle>Saved lenders</CardTitle>
          <p className="mt-2 text-3xl font-bold text-navy">{lenderCount}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>Recent deals</CardTitle>
        <div className="mt-3 flex flex-col divide-y divide-silver/30">
          {dealsRaw.length === 0 && (
            <p className="py-4 text-sm text-text-secondary">
              No deals yet. Start with the seeded demo deal on the Deals page, or create your own.
            </p>
          )}
          {[...dealsRaw]
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 5)
            .map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="flex items-center justify-between py-3 text-sm hover:bg-soft-blue/40"
              >
                <div>
                  <p className="font-medium text-text-primary">
                    {deal.address} {deal.isDemo && <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] text-warning">DEMO</span>}
                  </p>
                  <p className="text-text-secondary">{deal.stage.replace("_", " ")}</p>
                </div>
                <p className="text-text-secondary">
                  {deal.askingPrice ? `$${Math.round(deal.askingPrice).toLocaleString()}` : "No asking price"}
                </p>
              </Link>
            ))}
        </div>
      </Card>
    </div>
  );
}
