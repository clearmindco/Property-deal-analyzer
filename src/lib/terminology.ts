// Simple <-> Pro terminology + tooltip glossary (spec section 2). The calculations never
// change between modes -- only the label, and how much explanation is shown, does.

export interface Term {
  simple: string;
  pro: string;
  tooltip: string;
}

export const TERMS: Record<string, Term> = {
  cashToClose: {
    simple: "Money you'll need",
    pro: "Estimated cash to close",
    tooltip: "The cash you need to bring to the table to buy and start renovating this property.",
  },
  cashFlow: {
    simple: "Money you could keep each month",
    pro: "Net monthly cash flow",
    tooltip: "Rent minus the mortgage payment and every operating expense (taxes, insurance, vacancy, maintenance, CapEx, and management).",
  },
  arv: {
    simple: "Value after renovations",
    pro: "ARV",
    tooltip: "After Repair Value: the estimated value of the property after the planned renovations are completed. Never guaranteed by an appraiser.",
  },
  dscr: {
    simple: "Does the rent comfortably cover the loan?",
    pro: "DSCR",
    tooltip: "Debt Service Coverage Ratio: the property's net operating income divided by its annual mortgage payment. Above 1.0 means the rent covers the loan.",
  },
  points: {
    simple: "Upfront lender fee",
    pro: "Points",
    tooltip: "One point equals 1% of the loan amount, charged upfront by the lender.",
  },
  ltc: {
    simple: "% of total cost the lender covers",
    pro: "LTC",
    tooltip: "Loan-to-Cost tells you how much of the total purchase and renovation cost the lender will finance.",
  },
  arvLtv: {
    simple: "% of after-repair value the lender covers",
    pro: "ARV / LTV cap",
    tooltip: "The lender caps your loan at a percentage of the After Repair Value, regardless of your purchase price and rehab budget.",
  },
  noi: {
    simple: "Yearly profit before the loan payment",
    pro: "NOI",
    tooltip: "Net Operating Income: annual rent minus operating expenses, before the mortgage payment.",
  },
  capRate: {
    simple: "Yearly return if you paid all cash",
    pro: "Cap rate",
    tooltip: "Net Operating Income divided by purchase price -- the return you'd earn with no financing at all.",
  },
  cashOnCash: {
    simple: "Yearly return on the cash you actually put in",
    pro: "Cash-on-cash return",
    tooltip: "Annual cash flow divided by the actual cash you invested, after financing.",
  },
  cashLeftInProperty: {
    simple: "Money still stuck in the deal after refinancing",
    pro: "Cash left in property",
    tooltip: "How much of your original cash investment is still tied up in the property after you refinance out of the hard-money loan.",
  },
  seasoning: {
    simple: "How long you must own it before refinancing",
    pro: "Seasoning period",
    tooltip: "Many lenders require you to hold title for a minimum number of months before they'll refinance you.",
  },
};

export function term(key: keyof typeof TERMS, mode: "simple" | "pro"): string {
  const t = TERMS[key];
  if (!t) return key;
  return mode === "simple" ? t.simple : t.pro;
}
