// Chief of Staff: turns company information into TODAY'S PLAN. Orchestrates the other ops
// engines (never reimplements their logic) into the exact spec'd buckets: URGENT / MONEY
// MOVES / SELLER MOVES / MARKETING / DEALS / WAITING ON OTHERS / ADMIN / TOP 3 PRIORITIES.

import type { DealKillerFlag, ValueArv, Rehab, Rent } from "@/lib/types/deal";
import { findStaleRecords, type StaleDealInput, type StaleLeadInput } from "./staleness";
import { summarizeAcquisitionsPipeline, type PipelineLeadInput } from "./acquisitionsPipeline";
import { findDealsNeedingUnderwriting, type UnderwritingDealInput } from "./underwritingQueue";
import { topPriorities, type PriorityCandidate } from "./priorities";

export interface PlanDealInput {
  id: string;
  address: string;
  stage: string;
  nextAction: string | null;
  nextActionOwner: string | null;
  nextContactMethod: string | null;
  followUpCadence: string | null;
  dealKillers: DealKillerFlag[];
  valueArv: ValueArv;
  rehab: Rehab;
  rent: Rent;
}

export interface PlanLeadInput {
  id: string;
  sellerName: string;
  status: string;
  leadType: string | null;
  nextAction: string | null;
  nextActionOwner: string | null;
  nextContactMethod: string | null;
  nextFollowUpAt: string | Date | null;
  lastContactAt: string | Date | null;
}

export interface TodayPlanItem {
  label: string;
  detail: string;
}

export interface TodayPlan {
  urgent: TodayPlanItem[];
  moneyMoves: TodayPlanItem[];
  sellerMoves: TodayPlanItem[];
  marketing: TodayPlanItem[];
  deals: TodayPlanItem[];
  waitingOnOthers: TodayPlanItem[];
  admin: TodayPlanItem[];
  topPriorities: PriorityCandidate[];
}

const OTHERS_OWNERS = new Set(["SELLER", "AGENT", "WHOLESALER", "LENDER", "CONTRACTOR", "ATTORNEY"]);

export function buildTodayPlan(
  deals: PlanDealInput[],
  leads: PlanLeadInput[],
  marketingItems: TodayPlanItem[] = [],
  now: Date = new Date()
): TodayPlan {
  const staleDealInputs: StaleDealInput[] = deals.map((d) => ({
    id: d.id, address: d.address, stage: d.stage, nextAction: d.nextAction,
    nextActionOwner: d.nextActionOwner, followUpCadence: d.followUpCadence, dealKillers: d.dealKillers,
  }));
  const staleLeadInputs: StaleLeadInput[] = leads.map((l) => ({
    id: l.id, sellerName: l.sellerName, status: l.status, nextAction: l.nextAction,
    nextActionOwner: l.nextActionOwner, nextFollowUpAt: l.nextFollowUpAt,
  }));
  const staleRecords = findStaleRecords(staleDealInputs, staleLeadInputs, now);

  const pipelineInputs: PipelineLeadInput[] = leads.map((l) => ({
    id: l.id, sellerName: l.sellerName, status: l.status, leadType: l.leadType,
    lastContactAt: l.lastContactAt, nextFollowUpAt: l.nextFollowUpAt,
  }));
  const pipeline = summarizeAcquisitionsPipeline(pipelineInputs, now);

  const underwritingInputs: UnderwritingDealInput[] = deals.map((d) => ({
    id: d.id, address: d.address, stage: d.stage, dealKillers: d.dealKillers,
    valueArv: d.valueArv, rehab: d.rehab, rent: d.rent,
  }));
  const dealsNeedingUnderwriting = findDealsNeedingUnderwriting(underwritingInputs);

  const urgent: TodayPlanItem[] = [
    ...pipeline.overdueFollowUps.map((l) => ({
      label: `Follow up with ${l.sellerName}`,
      detail: `Overdue since ${l.nextFollowUpAt.toLocaleDateString()}`,
    })),
    ...pipeline.staleActiveConversations.map((l) => ({
      label: `Respond to ${l.sellerName}`,
      detail: `No contact logged in 48+ hours (status: ${l.status})`,
    })),
  ];

  const moneyMoves: TodayPlanItem[] = dealsNeedingUnderwriting.map((d) => ({
    label: d.address,
    detail: d.reasons.join("; "),
  }));

  const sellerMoves: TodayPlanItem[] = leads
    .filter((l) => l.nextAction && l.nextActionOwner === "US")
    .map((l) => ({
      label: `${l.sellerName}: ${l.nextAction}`,
      detail: l.nextContactMethod ? `via ${l.nextContactMethod}` : "",
    }));

  const dealsSection: TodayPlanItem[] = deals
    .filter((d) => !["CLOSED", "DEAD"].includes(d.stage))
    .map((d) => ({ label: d.address, detail: `Stage: ${d.stage}` }));

  const waitingOnOthers: TodayPlanItem[] = [
    ...deals
      .filter((d) => d.nextActionOwner && OTHERS_OWNERS.has(d.nextActionOwner))
      .map((d) => ({ label: `${d.nextActionOwner} -- ${d.address}`, detail: d.nextAction ?? "" })),
    ...leads
      .filter((l) => l.nextActionOwner && OTHERS_OWNERS.has(l.nextActionOwner))
      .map((l) => ({ label: `${l.nextActionOwner} -- ${l.sellerName}`, detail: l.nextAction ?? "" })),
  ];

  const admin: TodayPlanItem[] = staleRecords
    .filter((r) => r.reasons.some((reason) => reason.startsWith("No ")))
    .map((r) => ({ label: r.label, detail: r.reasons.join("; ") }));

  const priorityCandidates: PriorityCandidate[] = [
    ...pipeline.overdueFollowUps.map((l) => ({
      id: l.id, kind: "LEAD" as const, label: `Follow up with ${l.sellerName}`,
      deadlineDate: l.nextFollowUpAt, revenueImpact: 2 as const, risk: 1 as const,
    })),
    ...dealsNeedingUnderwriting.map((d) => ({
      id: d.id, kind: "DEAL" as const, label: `Underwrite ${d.address}`,
      revenueImpact: 2 as const, dealProbability: 1 as const,
    })),
    ...sellerMoves.map((m, i) => ({
      id: `seller-move-${i}`, kind: "LEAD" as const, label: m.label,
      revenueImpact: 1 as const, dealProbability: 1 as const,
    })),
  ];

  return {
    urgent,
    moneyMoves,
    sellerMoves,
    marketing: marketingItems,
    deals: dealsSection,
    waitingOnOthers,
    admin,
    topPriorities: topPriorities(priorityCandidates, now),
  };
}
