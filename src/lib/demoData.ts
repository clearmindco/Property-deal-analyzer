// DEMO / EDUCATIONAL DATA ONLY.
//
// This is the hard-money teaching example from the product spec (section 38). None of
// these numbers are a verified property fact -- the $120,000 ARV and $20,000 rehab are
// hypothetical inputs used to teach the BRRRR workflow, not an appraisal or contractor bid.
import type {
  Financing, InvestorRequirements, Rehab, Rent, ValueArv,
} from "./types/deal";

export const DEMO_ADDRESS = "123 Demo Street, Rochester, NY 14606";
export const DEMO_PURCHASE_PRICE = 74000;

export const DEMO_VALUE_ARV: ValueArv = {
  asIsValue: { value: 78000, provenance: { status: "ASSUMPTION", note: "Demo/educational data" } },
  conservativeArv: { value: 110000, provenance: { status: "ASSUMPTION", note: "Demo/educational data" } },
  likelyArv: { value: 120000, provenance: { status: "ASSUMPTION", note: "Demo/educational data" } },
  upperArv: { value: 128000, provenance: { status: "ASSUMPTION", note: "Demo/educational data" } },
  brrrUnderwritingArv: { value: 110000, provenance: { status: "ASSUMPTION", note: "Conservative ARV used for BRRRR underwriting; demo/educational data" } },
  comparables: [],
};

export const DEMO_REHAB: Rehab = {
  lineItems: [
    { category: "kitchen", low: 6000, expected: 8000, high: 11000, notes: "Demo/educational data" },
    { category: "bathrooms", low: 3000, expected: 4000, high: 5500, notes: "Demo/educational data" },
    { category: "flooring", low: 2000, expected: 3000, high: 4000, notes: "Demo/educational data" },
    { category: "paint", low: 1500, expected: 2000, high: 2500, notes: "Demo/educational data" },
    { category: "roof", low: 0, expected: 0, high: 3000, needsInspection: true, notes: "Assumed adequate; verify with inspection" },
  ],
  contingencyPct: 0.15,
};

export const DEMO_RENT: Rent = {
  market: {
    conservativeRent: { value: 1650, provenance: { status: "ASSUMPTION", note: "Demo/educational data" } },
    likelyRent: { value: 1800, provenance: { status: "ASSUMPTION", note: "Demo/educational data" } },
    upperRent: { value: 1950, provenance: { status: "ASSUMPTION", note: "Demo/educational data" } },
    comparables: [],
  },
};

export const DEMO_FINANCING: Financing = {
  hardMoney: {
    ratePct: 0.11,
    points: 2,
    purchaseFinancedPct: 0.9,
    rehabFinancedPct: 1.0,
    ltcCapPct: 0.9,
    arvLtvCapPct: 0.7,
    minLoan: 50000,
    drawFee: 250,
    appraisalFee: 600,
    underwritingFee: 995,
    termMonths: 12,
    rehabInterestOnFullCommitment: false,
  },
  refinance: {
    refiLtvPct: 0.75,
    ratePct: 0.07,
    termYears: 30,
    closingCostsPct: 0.03,
    seasoningMonths: 6,
    minDscr: 1.2,
  },
  expenses: {
    taxesAnnual: 3500,
    insuranceAnnual: 1100,
    vacancyPct: 0.05,
    maintenancePct: 0.05,
    capexPct: 0.05,
    managementPct: 0.08,
  },
  holdPeriodMonths: 6,
};

export const DEMO_REQUIREMENTS: InvestorRequirements = {
  minMonthlyCashFlowPerDoor: 150,
  maxCashLeftInPropertyAfterRefi: 10000,
  minEquityCreatedPct: 0.15,
  reservesRequired: 5000,
};

export function demoRehabTotal(): number {
  const base = DEMO_REHAB.lineItems.reduce((sum, item) => sum + item.expected, 0);
  return base * (1 + DEMO_REHAB.contingencyPct);
}
