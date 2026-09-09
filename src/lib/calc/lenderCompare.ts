import type { HardMoneyTerms } from "@/lib/types/deal";
import { calculateHardMoneyLoan, type HardMoneyLoanResult } from "./hardMoney";

export interface LenderComparisonRow {
  lenderId: string;
  lenderName: string;
  terms: HardMoneyTerms;
  loan: HardMoneyLoanResult;
  verified: boolean;
}

export interface LenderComparisonResult {
  rows: LenderComparisonRow[];
  bestFitLenderId?: string;
  bestFitReason?: string;
}

/**
 * Runs the SAME property/rehab/ARV through every saved lender's terms and ranks them.
 * "Best fit" is not simply the lowest rate: it's the qualifying lender (loan clears their
 * own minimum) with the lowest total financing cost (points + fees + estimated hold interest)
 * for a loan amount that actually covers the deal, with direct verified quotes preferred
 * over advertised terms when financing costs are close (spec section 16, section 14).
 */
export function compareLenders(
  purchasePrice: number,
  rehabTotal: number,
  arv: number,
  holdPeriodMonths: number,
  lenders: Array<{ id: string; name: string; terms: HardMoneyTerms; verified: boolean }>
): LenderComparisonResult {
  const rows: LenderComparisonRow[] = lenders.map((lender) => ({
    lenderId: lender.id,
    lenderName: lender.name,
    terms: lender.terms,
    loan: calculateHardMoneyLoan(purchasePrice, rehabTotal, lender.terms, arv, holdPeriodMonths),
    verified: lender.verified,
  }));

  const qualifying = rows.filter((r) => r.loan.qualifies);
  const candidates = qualifying.length > 0 ? qualifying : rows;

  if (candidates.length === 0) {
    return { rows };
  }

  const sorted = [...candidates].sort((a, b) => {
    const costDiff = a.loan.totalFinancingCost - b.loan.totalFinancingCost;
    if (Math.abs(costDiff) > 250) return costDiff;
    // Costs are close: prefer a direct verified quote over advertised terms.
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    return costDiff;
  });

  const best = sorted[0];
  if (!best) return { rows };

  const reasonParts: string[] = [];
  reasonParts.push(`lowest total financing cost ($${Math.round(best.loan.totalFinancingCost).toLocaleString()})`);
  if (!best.loan.qualifies) reasonParts.push("but this lender's minimum loan is not met -- verify before relying on this");
  if (best.verified) reasonParts.push("terms are from a direct verified quote");
  else reasonParts.push("terms are advertised, not yet a direct quote -- confirm before offering");

  return {
    rows,
    bestFitLenderId: best.lenderId,
    bestFitReason: reasonParts.join("; "),
  };
}
