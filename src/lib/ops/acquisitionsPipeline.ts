// Acquisitions Director: where every seller conversation stands, and the rule "do not
// generate more leads while active conversations that require responses are being ignored"
// (Chief of Staff owns what to actually do about that; this engine only surfaces the fact).

export interface PipelineLeadInput {
  id: string;
  sellerName: string;
  status: string;
  leadType: string | null;
  lastContactAt: string | Date | null;
  nextFollowUpAt: string | Date | null;
}

export interface AcquisitionsPipelineSummary {
  byStatus: Record<string, number>;
  overdueFollowUps: Array<{ id: string; sellerName: string; nextFollowUpAt: Date }>;
  // Leads in an active conversation state with no contact in the stale window -- approximated
  // from lastContactAt since the schema doesn't track "who sent the last message." Never
  // presented as a verified unread message, only as a signal worth checking.
  staleActiveConversations: Array<{ id: string; sellerName: string; status: string }>;
  ignoreNewLeadGenReason: string | null;
}

const ACTIVE_CONVERSATION_STATUSES = new Set(["TALKING", "QUALIFIED", "CALL_SCHEDULED", "OFFER", "FOLLOW_UP"]);
const STALE_CONTACT_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

function toDate(value: string | Date | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function summarizeAcquisitionsPipeline(
  leads: PipelineLeadInput[],
  now: Date = new Date()
): AcquisitionsPipelineSummary {
  const byStatus: Record<string, number> = {};
  const overdueFollowUps: AcquisitionsPipelineSummary["overdueFollowUps"] = [];
  const staleActiveConversations: AcquisitionsPipelineSummary["staleActiveConversations"] = [];

  for (const lead of leads) {
    byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;

    const followUp = toDate(lead.nextFollowUpAt);
    if (followUp && followUp.getTime() < now.getTime()) {
      overdueFollowUps.push({ id: lead.id, sellerName: lead.sellerName, nextFollowUpAt: followUp });
    }

    if (ACTIVE_CONVERSATION_STATUSES.has(lead.status)) {
      const lastContact = toDate(lead.lastContactAt);
      const staleSinceContact = !lastContact || now.getTime() - lastContact.getTime() > STALE_CONTACT_WINDOW_MS;
      if (staleSinceContact) {
        staleActiveConversations.push({ id: lead.id, sellerName: lead.sellerName, status: lead.status });
      }
    }
  }

  const ignoreNewLeadGenReason =
    staleActiveConversations.length > 0
      ? `${staleActiveConversations.length} active seller conversation${staleActiveConversations.length > 1 ? "s haven't" : " hasn't"} been touched in 48+ hours -- revenue-producing conversations come before new lead generation.`
      : null;

  return { byStatus, overdueFollowUps, staleActiveConversations, ignoreNewLeadGenReason };
}
