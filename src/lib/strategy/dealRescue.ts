import type { OperatingExpenseAssumptions } from "@/lib/types/deal";
import type { RescueOption } from "@/lib/types/strategy";
import { operatingExpenseBreakdown } from "@/lib/calc/noi";
import { requiredRentForTargetCashFlow } from "@/lib/calc/cashFlow";
import { principalFromMonthlyPayment } from "@/lib/calc/mortgage";

// Deal Rescue Engine: "CAN WE RESCUE THIS DEAL?" -- every failed strategy should reverse-solve
// for the specific number that would fix it, never just report FAIL and stop. Every option
// below is included only when the caller supplies enough to compute it honestly -- this engine
// never fabricates an end-buyer price or a BRRRR ceiling it wasn't given.

export interface RescueContext {
  rentMonthly: number;
  expenses: OperatingExpenseAssumptions;
  targetCashFlow: number;
  currentCashFlow: number;
  currentDebtService: number;

  // Option A (lower price) / Option B (better terms) -- the rate/term that applies to the
  // failing structure, and the down payment already committed (to translate a max loan back
  // into a max purchase price).
  debtRatePct?: number;
  debtTermYears?: number;
  currentDownPayment?: number;

  // Option C (lower cash entry) -- a cash ceiling (e.g. the investor's own max-cash-in-deal
  // requirement) and the closing costs already assumed.
  maxCashAllowed?: number;
  closingCosts?: number;

  // Option D (BRRRR) -- computed elsewhere (src/lib/calc/acquisitionPrice.ts) and passed
  // through so this engine never duplicates that reverse-solve.
  brrrMaxAcquisition?: number;

  // Option F (wholesale) -- an end-buyer's max acquisition price for the same property under
  // their own strategy, and what we'd actually be paying if we bought it ourselves.
  wholesaleEndBuyerMaxPrice?: number;
  currentTotalAcquisitionPrice?: number;
}

function money(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

/** Returns [] when the deal isn't actually failing -- rescue options only make sense for a
 * shortfall. */
export function computeRescueOptions(ctx: RescueContext): RescueOption[] {
  const shortfall = ctx.targetCashFlow - ctx.currentCashFlow;
  if (shortfall <= 0) return [];

  const options: RescueOption[] = [];
  const expenseBreakdown = operatingExpenseBreakdown(ctx.rentMonthly, ctx.expenses);
  const maxDebtService = ctx.rentMonthly - expenseBreakdown.totalMonthly - ctx.targetCashFlow;

  if (maxDebtService > 0) {
    options.push({
      label: "Option B -- Better Terms",
      description: `Monthly debt service would need to be ${money(maxDebtService)} or less to hit ${money(ctx.targetCashFlow)}/mo cash flow.`,
    });

    if (ctx.debtRatePct !== undefined && ctx.debtTermYears !== undefined) {
      const maxLoan = principalFromMonthlyPayment(maxDebtService, ctx.debtRatePct, ctx.debtTermYears);
      if (ctx.currentDownPayment !== undefined) {
        options.push({
          label: "Option A -- Lower Price",
          description: `At these terms, purchase (or total acquisition) would need to be ${money(maxLoan + ctx.currentDownPayment)} or below.`,
        });
      }
    }
  } else {
    options.push({
      label: "Option B -- Better Terms",
      description: "Even a $0 monthly payment wouldn't reach the target cash flow at this rent and expense level -- the structure alone can't fix this.",
    });
  }

  if (ctx.maxCashAllowed !== undefined) {
    const maxDownPayment = ctx.maxCashAllowed - (ctx.closingCosts ?? 0);
    options.push({
      label: "Option C -- Lower Cash Entry",
      description: maxDownPayment > 0
        ? `Down payment (or cash to close) would need to be ${money(maxDownPayment)} or less to stay within the cash you're willing to put in.`
        : "Closing costs alone exceed the cash you're willing to put in -- this structure needs a lower price or a cash contribution from the seller.",
    });
  }

  if (ctx.brrrMaxAcquisition !== undefined) {
    options.push({
      label: "Option D -- BRRRR",
      description: `Purchase price plus rehab would need to stay at or below ${money(ctx.brrrMaxAcquisition)} for the refinance to return your cash.`,
    });
  }

  const requiredRent = requiredRentForTargetCashFlow(ctx.currentDebtService, ctx.expenses, ctx.targetCashFlow);
  if (Number.isFinite(requiredRent)) {
    options.push({
      label: "Option E -- Higher Rent",
      description: `Verified rent would need to reach ${money(requiredRent)}/mo at the current price and terms.`,
    });
  }

  if (ctx.wholesaleEndBuyerMaxPrice !== undefined && ctx.currentTotalAcquisitionPrice !== undefined) {
    const spread = ctx.wholesaleEndBuyerMaxPrice - ctx.currentTotalAcquisitionPrice;
    options.push({
      label: "Option F -- Wholesale",
      description: spread > 0
        ? `An end buyer using their own strategy could potentially pay up to ${money(ctx.wholesaleEndBuyerMaxPrice)} -- a potential assignment spread of about ${money(spread)}.`
        : `At your current acquisition price of ${money(ctx.currentTotalAcquisitionPrice)}, there's no positive spread to a ${money(ctx.wholesaleEndBuyerMaxPrice)} end-buyer price -- wholesaling this at a profit isn't supported by these numbers.`,
    });
  }

  options.push({
    label: "Option G -- Pass",
    description: "If none of the above can be verified or negotiated, no reasonable structure creates sufficient return -- passing is a legitimate outcome.",
  });

  return options;
}
