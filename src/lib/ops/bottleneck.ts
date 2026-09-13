// Business Bottleneck Engine: identify ONE current constraint, never a pile of "urgent" items.
// A single deterministic decision tree over already-computed aggregate counts -- ordered
// checks, first match wins, so the app never reports more than one bottleneck at a time.

export interface BottleneckInputs {
  newLeadsThisWeek: number;
  staleActiveConversations: number; // from acquisitionsPipeline.ts
  overdueFollowUps: number;
  callsScheduled: number;
  callsCompleted: number;
  offersCount: number;
  contractsCount: number;
  dealsNeedingUnderwriting: number;
  cfoVerdict: "APPROVE" | "DO_NOT_APPROVE_YET" | "NEEDS_INFO";
}

export type BottleneckLabel =
  | "NOT_ENOUGH_LEADS"
  | "FOLLOW_UP_FAILURE"
  | "SELLERS_NOT_MOVING_TO_CALLS"
  | "OFFERS_NOT_CONVERTING"
  | "DEALS_FAILING_UNDERWRITING"
  | "CAPITAL_BOTTLENECK"
  | "NONE_IDENTIFIED";

export interface BottleneckResult {
  label: BottleneckLabel;
  explanation: string;
  recommendation: string;
}

export function detectBottleneck(inputs: BottleneckInputs): BottleneckResult {
  if (inputs.cfoVerdict === "DO_NOT_APPROVE_YET") {
    return {
      label: "CAPITAL_BOTTLENECK",
      explanation: "The CFO capital-position check says active deal cash requirements would breach the reserve minimum.",
      recommendation: "Do not add new commitments. Resolve the capital shortfall (raise reserves, pass on a deal, or refinance) before pursuing more acquisitions.",
    };
  }
  if (inputs.overdueFollowUps > 0 || inputs.staleActiveConversations > 0) {
    return {
      label: "FOLLOW_UP_FAILURE",
      explanation: `${inputs.overdueFollowUps} overdue follow-up(s) and ${inputs.staleActiveConversations} stale active conversation(s).`,
      recommendation: "Clear the follow-up backlog before generating more leads -- revenue-producing conversations before busy work.",
    };
  }
  if (inputs.newLeadsThisWeek === 0) {
    return {
      label: "NOT_ENOUGH_LEADS",
      explanation: "No new leads recorded this week.",
      recommendation: "Prioritize today's Facebook/marketing actions.",
    };
  }
  if (inputs.callsScheduled > 0 && inputs.callsCompleted === 0) {
    return {
      label: "SELLERS_NOT_MOVING_TO_CALLS",
      explanation: "Calls are scheduled but none have been completed.",
      recommendation: "Confirm and run the scheduled calls before adding more to the pipeline.",
    };
  }
  if (inputs.dealsNeedingUnderwriting > 0 && inputs.offersCount === 0) {
    return {
      label: "DEALS_FAILING_UNDERWRITING",
      explanation: `${inputs.dealsNeedingUnderwriting} deal(s) have incomplete underwriting inputs and none have reached an offer.`,
      recommendation: "Complete underwriting on the deals already in the pipeline before sourcing more.",
    };
  }
  if (inputs.offersCount > 0 && inputs.contractsCount === 0) {
    return {
      label: "OFFERS_NOT_CONVERTING",
      explanation: "Offers are out but none have converted to a contract.",
      recommendation: "Review why offers are stalling -- price, terms, or seller responsiveness -- before making more offers.",
    };
  }
  return {
    label: "NONE_IDENTIFIED",
    explanation: "No single constraint stands out from current data.",
    recommendation: "Keep executing today's plan.",
  };
}
