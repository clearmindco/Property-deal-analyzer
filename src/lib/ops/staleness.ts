// Company Command Center: "aggressively identify records that have no next action, no
// follow-up date, no owner, no status, overdue follow-ups, missing underwriting information."
// Pure function -- callers fetch Deal/Lead rows and deserialize their JSON fields first.

import type { DealKillerFlag } from "@/lib/types/deal";

export interface StaleDealInput {
  id: string;
  address: string;
  stage: string;
  nextAction: string | null;
  nextActionOwner: string | null;
  followUpCadence: string | null;
  dealKillers: DealKillerFlag[];
}

export interface StaleLeadInput {
  id: string;
  sellerName: string;
  status: string;
  nextAction: string | null;
  nextActionOwner: string | null;
  nextFollowUpAt: string | Date | null;
}

export interface StaleRecord {
  kind: "DEAL" | "LEAD";
  id: string;
  label: string;
  reasons: string[];
}

const TERMINAL_DEAL_STAGES = new Set(["CLOSED", "DEAD"]);
const TERMINAL_LEAD_STATUSES = new Set(["CLOSED", "DEAD"]);

function toDate(value: string | Date | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function findStaleRecords(
  deals: StaleDealInput[],
  leads: StaleLeadInput[],
  now: Date = new Date()
): StaleRecord[] {
  const records: StaleRecord[] = [];

  for (const deal of deals) {
    if (TERMINAL_DEAL_STAGES.has(deal.stage)) continue;
    const reasons: string[] = [];
    if (!deal.nextAction) reasons.push("No next action set");
    if (!deal.nextActionOwner) reasons.push("No owner assigned for the next response");
    if (!deal.followUpCadence || deal.followUpCadence === "NONE") reasons.push("No follow-up cadence set");
    const flagged = deal.dealKillers.filter((k) => k.status !== "OK");
    if (flagged.length > 0) {
      reasons.push(`${flagged.length} unresolved deal-killer flag${flagged.length > 1 ? "s" : ""} (${flagged.map((f) => f.label).join(", ")})`);
    }
    if (reasons.length > 0) {
      records.push({ kind: "DEAL", id: deal.id, label: deal.address, reasons });
    }
  }

  for (const lead of leads) {
    if (TERMINAL_LEAD_STATUSES.has(lead.status)) continue;
    const reasons: string[] = [];
    if (!lead.nextAction) reasons.push("No next action set");
    if (!lead.nextActionOwner) reasons.push("No owner assigned for the next response");
    const followUp = toDate(lead.nextFollowUpAt);
    if (!followUp) {
      reasons.push("No follow-up date set");
    } else if (followUp.getTime() < now.getTime()) {
      const daysOverdue = Math.floor((now.getTime() - followUp.getTime()) / 86_400_000);
      reasons.push(`Follow-up overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}`);
    }
    if (reasons.length > 0) {
      records.push({ kind: "LEAD", id: lead.id, label: lead.sellerName, reasons });
    }
  }

  return records;
}
