import type {
  DealKillerFlag, Financing, PropertyDetails, Rehab, Rent, ValueArv, InvestorRequirements,
  CreativeFinance,
} from "./types/deal";

export function defaultPropertyDetails(): PropertyDetails {
  return {};
}

export function defaultValueArv(): ValueArv {
  return { comparables: [] };
}

export function defaultRehab(): Rehab {
  return { lineItems: [], contingencyPct: 0.15 };
}

export function defaultRent(): Rent {
  return { market: { comparables: [] } };
}

export function defaultFinancing(): Financing {
  return {
    hardMoney: {
      ratePct: 0.11, points: 2, purchaseFinancedPct: 0.9, rehabFinancedPct: 1.0,
      ltcCapPct: 0.9, arvLtvCapPct: 0.7, termMonths: 12, rehabInterestOnFullCommitment: false,
    },
    refinance: { refiLtvPct: 0.75, ratePct: 0.07, termYears: 30, closingCostsPct: 0.03, minDscr: 1.2 },
    expenses: {
      taxesAnnual: 3000, insuranceAnnual: 1200, vacancyPct: 0.05, maintenancePct: 0.05,
      capexPct: 0.05, managementPct: 0.08,
    },
    holdPeriodMonths: 6,
  };
}

export function defaultCreativeFinance(): CreativeFinance {
  return {};
}

export function defaultRequirements(): InvestorRequirements {
  return {
    minMonthlyCashFlowPerDoor: 100,
    maxCashLeftInPropertyAfterRefi: 10000,
    minEquityCreatedPct: 0.1,
    reservesRequired: 5000,
  };
}

export const DEAL_KILLER_CATALOG: Array<{ key: string; label: string }> = [
  { key: "no_co", label: "No Certificate of Occupancy" },
  { key: "illegal_unit", label: "Illegal unit / illegal residential use" },
  { key: "foundation", label: "Foundation concern" },
  { key: "water_intrusion", label: "Active water intrusion" },
  { key: "unknown_sewer", label: "Unknown sewer" },
  { key: "weak_comps", label: "Weak ARV comps" },
  { key: "section8_legality", label: "Unverified Section 8 legality" },
  { key: "hm_minimum", label: "Hard-money minimum not met" },
  { key: "electrical", label: "Major electrical issue" },
  { key: "plumbing", label: "Major plumbing issue" },
  { key: "title", label: "Unclear title" },
  { key: "vacancy_not_guaranteed", label: "Vacancy not guaranteed at closing" },
  { key: "creative_finance_docs", label: "Creative-finance legal/documentation issue" },
  { key: "due_on_sale", label: "Due-on-sale exposure" },
  { key: "insurance", label: "Insurance issue" },
  { key: "seller_motivation", label: "Seller motivation inconsistent" },
  { key: "aggressive_assumptions", label: "Numbers only work under aggressive assumptions" },
];

export function defaultDealKillers(): DealKillerFlag[] {
  return DEAL_KILLER_CATALOG.map((item) => ({ key: item.key, label: item.label, status: "OK" as const }));
}
