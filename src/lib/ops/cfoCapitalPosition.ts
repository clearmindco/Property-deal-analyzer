// CFO: "PROPERTY WORKS" is not the same conclusion as "WE CAN RESPONSIBLY AFFORD TO BUY IT."
// Reuses the existing, tested hard-money calc engine (src/lib/calc/hardMoney.ts) for cash-to-
// close math -- this file never reimplements financing math, only compares it against real
// company cash facts from CompanySettings. If those facts are missing, this returns NEEDS_INFO
// rather than silently assuming the company can afford everything in the pipeline.

import { calculateHardMoneyLoan } from "@/lib/calc/hardMoney";
import type { ValueArv, Rehab, HardMoneyTerms } from "@/lib/types/deal";

export interface CapitalDealInput {
  id: string;
  address: string;
  stage: string;
  askingPrice: number | null;
  valueArv: ValueArv;
  rehab: Rehab;
  hardMoney: HardMoneyTerms;
  holdPeriodMonths: number;
}

export interface CompanySettingsInput {
  cashOnHand: number | null;
  reserveMinimum: number | null;
  committedCapital: number | null;
}

export interface DealCapitalRequirement {
  id: string;
  address: string;
  cashRequired: number | null; // null means NEEDS_INFO -- couldn't compute (missing price/ARV)
  needsInfoReason?: string;
}

export type CfoVerdict = "APPROVE" | "DO_NOT_APPROVE_YET" | "NEEDS_INFO";

export interface CfoCapitalResult {
  verdict: CfoVerdict;
  reason: string;
  dealRequirements: DealCapitalRequirement[];
  totalCashRequiredKnown: number;
  dealsWithUnknownCashRequired: number;
  liquidityAfterActiveDeals: number | null; // null when settings are incomplete
}

const TERMINAL_STAGES = new Set(["CLOSED", "DEAD"]);

function rehabTotal(rehab: Rehab): number {
  const subtotal = rehab.lineItems.reduce((sum, item) => sum + item.expected, 0);
  return subtotal * (1 + rehab.contingencyPct);
}

function resolveArv(valueArv: ValueArv): number | null {
  return (
    valueArv.brrrUnderwritingArv?.value ??
    valueArv.conservativeArv?.value ??
    valueArv.likelyArv?.value ??
    valueArv.asIsValue?.value ??
    null
  );
}

export function evaluateCapitalPosition(
  deals: CapitalDealInput[],
  settings: CompanySettingsInput | null
): CfoCapitalResult {
  const activeDeals = deals.filter((d) => !TERMINAL_STAGES.has(d.stage));
  const dealRequirements: DealCapitalRequirement[] = activeDeals.map((deal) => {
    const arv = resolveArv(deal.valueArv);
    const purchasePrice = deal.askingPrice;
    if (arv === null || purchasePrice === null) {
      return {
        id: deal.id,
        address: deal.address,
        cashRequired: null,
        needsInfoReason: purchasePrice === null ? "No asking price entered" : "No ARV entered",
      };
    }
    const hm = calculateHardMoneyLoan(purchasePrice, rehabTotal(deal.rehab), deal.hardMoney, arv, deal.holdPeriodMonths);
    return {
      id: deal.id,
      address: deal.address,
      cashRequired: hm.cashToClose + hm.rehabCashRequired + hm.estimatedInterestDuringHold,
    };
  });

  const totalCashRequiredKnown = dealRequirements.reduce((sum, d) => sum + (d.cashRequired ?? 0), 0);
  const dealsWithUnknownCashRequired = dealRequirements.filter((d) => d.cashRequired === null).length;

  if (!settings || settings.cashOnHand === null || settings.reserveMinimum === null) {
    return {
      verdict: "NEEDS_INFO",
      reason: "Company Settings (cash on hand / reserve minimum) haven't been entered yet -- capital-position checks can't run without them.",
      dealRequirements,
      totalCashRequiredKnown,
      dealsWithUnknownCashRequired,
      liquidityAfterActiveDeals: null,
    };
  }

  const committed = settings.committedCapital ?? 0;
  const liquidityAfterActiveDeals = settings.cashOnHand - committed - totalCashRequiredKnown;
  const meetsReserve = liquidityAfterActiveDeals >= settings.reserveMinimum;

  return {
    verdict: meetsReserve ? "APPROVE" : "DO_NOT_APPROVE_YET",
    reason: meetsReserve
      ? `Projected liquidity after active deals ($${Math.round(liquidityAfterActiveDeals).toLocaleString()}) stays at or above the $${Math.round(settings.reserveMinimum).toLocaleString()} reserve minimum.`
      : `Projected liquidity after active deals ($${Math.round(liquidityAfterActiveDeals).toLocaleString()}) would fall below the $${Math.round(settings.reserveMinimum).toLocaleString()} reserve minimum.`,
    dealRequirements,
    totalCashRequiredKnown,
    dealsWithUnknownCashRequired,
    liquidityAfterActiveDeals,
  };
}
