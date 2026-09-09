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

  // -- Financing tab: hard-money / rehab loan --
  hmRate: {
    simple: "Interest rate on the short-term loan",
    pro: "Rate",
    tooltip: "The annual interest rate the hard-money lender charges on this temporary loan.",
  },
  purchaseFinancedPct: {
    simple: "% of the price the lender covers",
    pro: "Purchase financed %",
    tooltip: "How much of the purchase price the lender will loan you. The rest is your down payment.",
  },
  rehabFinancedPct: {
    simple: "% of repair costs the lender covers",
    pro: "Rehab financed %",
    tooltip: "How much of your renovation budget the lender will loan you, usually paid back to you as you complete work (a \"draw\").",
  },
  drawFee: {
    simple: "Fee each time you request repair money",
    pro: "Draw fee",
    tooltip: "A flat fee the lender charges every time you ask them to release renovation funds.",
  },
  appraisalFee: {
    simple: "Fee for the lender's property valuation",
    pro: "Appraisal fee",
    tooltip: "A one-time cost for a licensed appraiser the lender hires to confirm the property's value.",
  },
  underwritingFee: {
    simple: "Fee for the lender processing your loan",
    pro: "Underwriting fee",
    tooltip: "A one-time cost the lender charges to review and approve your loan file.",
  },
  holdPeriod: {
    simple: "Months you expect to own it before refinancing",
    pro: "Hold period (months)",
    tooltip: "How long you plan to own the property under the temporary loan before refinancing into a long-term one.",
  },
  purchaseLoan: {
    simple: "Loan amount for the purchase",
    pro: "Purchase loan",
    tooltip: "The portion of the hard-money loan that goes toward buying the property.",
  },
  rehabLoan: {
    simple: "Loan amount for repairs",
    pro: "Rehab loan",
    tooltip: "The portion of the hard-money loan set aside to reimburse your renovation costs.",
  },
  totalLoan: {
    simple: "Total amount borrowed",
    pro: "Total loan",
    tooltip: "Purchase loan plus rehab loan combined -- the full hard-money loan amount.",
  },
  rehabCashRequired: {
    simple: "Repair money you pay yourself upfront",
    pro: "Rehab cash required",
    tooltip: "The part of the renovation budget the lender does not cover -- you pay this out of pocket, then may be reimbursed as work is completed.",
  },
  interestDuringHold: {
    simple: "Interest cost while you own it",
    pro: "Est. interest during hold",
    tooltip: "The estimated interest you'll pay on the hard-money loan for the months before you refinance.",
  },
  maxCashExposure: {
    simple: "Most cash you'll have tied up at once",
    pro: "Max temporary cash exposure",
    tooltip: "The peak amount of your own cash that's out of pocket at any single point before rehab reimbursements and the refinance come in.",
  },
  totalFinancingCost: {
    simple: "Total cost of this loan",
    pro: "Total financing cost",
    tooltip: "Points, fees, and estimated interest added together -- what this loan costs you regardless of how the property performs.",
  },

  // -- Financing tab: refinance --
  refiLtv: {
    simple: "% of after-repair value your new loan can be",
    pro: "Refi LTV %",
    tooltip: "The long-term lender will loan up to this percentage of the After Repair Value.",
  },
  refiRate: {
    simple: "Interest rate on your long-term loan",
    pro: "Rate",
    tooltip: "The annual interest rate on the permanent loan you refinance into.",
  },
  refiTerm: {
    simple: "Length of your long-term loan (years)",
    pro: "Term (years)",
    tooltip: "How many years you'll be paying off the permanent loan, e.g. a 30-year mortgage.",
  },
  refiClosingCosts: {
    simple: "Fees to refinance",
    pro: "Closing costs %",
    tooltip: "Lender and title fees charged when you refinance, as a percentage of the new loan amount.",
  },
  minDscr: {
    simple: "Cushion the lender wants between rent and payment",
    pro: "Min DSCR",
    tooltip: "The minimum Debt Service Coverage Ratio the lender requires -- how much bigger the rental income must be than the mortgage payment.",
  },
  refiLoanAmount: {
    simple: "Your new loan amount",
    pro: "Refi loan amount",
    tooltip: "The size of the permanent loan you refinance into, capped by the after-repair value and/or the rent's ability to cover it.",
  },
  hardMoneyPayoff: {
    simple: "Pays off the short-term loan",
    pro: "Payoff (hard money)",
    tooltip: "The amount of the new loan that goes straight to paying off the original hard-money loan balance.",
  },
  cashReturned: {
    simple: "Cash you get back",
    pro: "Cash returned",
    tooltip: "What's left of the new loan after paying off the hard-money loan and refinance closing costs -- this comes back to you.",
  },
  monthlyPI: {
    simple: "Your new monthly payment",
    pro: "Monthly P&I",
    tooltip: "Principal and interest -- the monthly payment on your new, permanent loan.",
  },
  equityAtRefi: {
    simple: "Your ownership stake in the property",
    pro: "Equity at refi",
    tooltip: "After-repair value minus your new loan balance -- the portion of the property you own outright.",
  },

  // -- Financing tab: operating expenses --
  vacancyPct: {
    simple: "Money set aside for months it's empty",
    pro: "Vacancy %",
    tooltip: "A percentage of rent set aside to cover the months the property sits without a tenant.",
  },
  maintenancePct: {
    simple: "Money set aside for regular upkeep",
    pro: "Maintenance %",
    tooltip: "A percentage of rent set aside for routine repairs -- a leaky faucet, a broken appliance, etc.",
  },
  capexPct: {
    simple: "Money set aside for big-ticket replacements",
    pro: "CapEx %",
    tooltip: "Capital Expenditures: a percentage of rent saved up for large, eventual replacements like a roof or furnace.",
  },
  managementPct: {
    simple: "Cost of a property manager",
    pro: "Management %",
    tooltip: "A percentage of rent for professional property management, kept in your numbers even if you plan to self-manage -- your time has value too.",
  },

  // -- Decision tab: requirements --
  minCashFlowPerDoor: {
    simple: "Money you want to keep each month, per unit",
    pro: "Min. monthly cash flow / door",
    tooltip: "The smallest monthly profit (after every expense and the mortgage) you're willing to accept, for each rental unit.",
  },
  maxCashLeftAfterRefi: {
    simple: "Most of your own money you're OK leaving in the deal",
    pro: "Max cash left after refi",
    tooltip: "After you refinance, some of your original cash may still be tied up in the property. This is the most you're willing to leave stuck there.",
  },
  minEquityCreated: {
    simple: "Instant ownership value you want to build in",
    pro: "Min. equity created",
    tooltip: "The minimum gap you want between what the property is worth (after repairs) and what it actually cost you, as a percentage of value.",
  },
  reservesRequired: {
    simple: "Emergency cash you want set aside",
    pro: "Reserves required",
    tooltip: "Cash you keep in the bank for this property, separate from the deal itself, in case something goes wrong.",
  },

  // -- Decision tab: acquisition price --
  targetOffer: {
    simple: "Starting offer",
    pro: "Target offer",
    tooltip: "A reasonable opening number to negotiate from -- below what the deal could actually support, to leave room to negotiate up.",
  },
  idealAcquisition: {
    simple: "Best price for a clean deal",
    pro: "Ideal acquisition",
    tooltip: "The price at which refinancing is expected to return ALL of your cash -- the textbook BRRRR outcome.",
  },
  maximumAcquisition: {
    simple: "Most you should ever pay",
    pro: "Maximum acquisition",
    tooltip: "The highest price where the deal still meets every requirement you set. Above this, the deal no longer fits on paper.",
  },
};

export function term(key: keyof typeof TERMS, mode: "simple" | "pro"): string {
  const t = TERMS[key];
  if (!t) return key;
  return mode === "simple" ? t.simple : t.pro;
}

export function tooltipFor(key: keyof typeof TERMS): string {
  return TERMS[key]?.tooltip ?? "";
}
