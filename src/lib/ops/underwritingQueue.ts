// Underwriting Director surface: which deals need attention. This never reimplements any
// Strategy Router / Deal Rescue / financing math -- it only reads existing Deal facts
// (dealKillers, valueArv, rehab, rent) to say "incomplete inputs" or "unresolved flags."

import type { DealKillerFlag, ValueArv, Rehab, Rent } from "@/lib/types/deal";

export interface UnderwritingDealInput {
  id: string;
  address: string;
  stage: string;
  dealKillers: DealKillerFlag[];
  valueArv: ValueArv;
  rehab: Rehab;
  rent: Rent;
}

export interface DealNeedsAttention {
  id: string;
  address: string;
  reasons: string[];
}

const TERMINAL_STAGES = new Set(["CLOSED", "DEAD"]);

export function findDealsNeedingUnderwriting(deals: UnderwritingDealInput[]): DealNeedsAttention[] {
  const results: DealNeedsAttention[] = [];

  for (const deal of deals) {
    if (TERMINAL_STAGES.has(deal.stage)) continue;
    const reasons: string[] = [];

    const hasArvBand = Boolean(deal.valueArv.conservativeArv || deal.valueArv.likelyArv || deal.valueArv.brrrUnderwritingArv);
    if (!hasArvBand) reasons.push("No ARV entered yet");

    if (deal.rehab.lineItems.length === 0) reasons.push("No rehab line items entered yet");

    const hasRent = Boolean(deal.rent.market.conservativeRent || deal.rent.market.likelyRent);
    if (!hasRent) reasons.push("No rent estimate entered yet");

    const flagged = deal.dealKillers.filter((k) => k.status !== "OK");
    if (flagged.length > 0) {
      reasons.push(`${flagged.length} unresolved deal-killer flag${flagged.length > 1 ? "s" : ""}`);
    }

    if (reasons.length > 0) results.push({ id: deal.id, address: deal.address, reasons });
  }

  return results;
}
