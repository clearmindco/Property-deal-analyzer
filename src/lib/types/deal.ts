// Shared TypeScript types for the JSON blobs stored on Deal/Lender records.
// Keeping these as explicit types (rather than `any`) is what lets the
// calculation engine (src/lib/calc) stay strictly typed and unit-testable.

export type ConfidenceStatus =
  | "VERIFIED"
  | "HIGH_CONFIDENCE"
  | "MEDIUM_CONFIDENCE"
  | "LOW_CONFIDENCE"
  | "ASSUMPTION"
  | "NEEDS_INSPECTION"
  | "NEEDS_VERIFICATION";

export interface Provenance {
  status: ConfidenceStatus;
  source?: string;
  note?: string;
  updatedAt?: string;
}

export interface ValuedField<T> {
  value: T;
  provenance: Provenance;
}

export interface PropertyDetails {
  roofAgeYears?: ValuedField<number>;
  furnaceAgeYears?: ValuedField<number>;
  waterHeaterAgeYears?: ValuedField<number>;
  electricalPanelAgeYears?: ValuedField<number>;
  occupancyAtClosing?: ValuedField<"VACANT" | "OCCUPIED" | "UNKNOWN">;
  annualTaxes?: ValuedField<number>;
  certificateOfOccupancy?: ValuedField<"YES" | "NO" | "UNKNOWN">;
  sewerType?: ValuedField<"CITY" | "SEPTIC" | "UNKNOWN">;
  foundationConcern?: ValuedField<boolean>;
}

export interface Comparable {
  id: string;
  address: string;
  saleDate?: string;
  salePrice: number;
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  distanceMiles?: number;
  match: "STRONG" | "MODERATE" | "WEAK" | "EXCLUDED";
  matchReason: string;
}

export interface ValueArv {
  asIsValue?: ValuedField<number>;
  conservativeArv?: ValuedField<number>;
  likelyArv?: ValuedField<number>;
  upperArv?: ValuedField<number>;
  brrrUnderwritingArv?: ValuedField<number>;
  comparables: Comparable[];
}

export type RehabCategory =
  | "roof" | "gutters" | "foundation" | "basement_water" | "sewer"
  | "electrical_panel" | "rewiring" | "plumbing" | "pex" | "boiler"
  | "furnace" | "central_ac" | "water_heater" | "windows" | "doors"
  | "kitchen" | "cabinets" | "counters" | "appliances" | "bathrooms"
  | "flooring" | "drywall" | "paint" | "lighting" | "trim" | "siding"
  | "driveway" | "landscaping" | "trash_out" | "permits" | "co_code" | "other";

export interface RehabLineItem {
  category: RehabCategory;
  low: number;
  expected: number;
  high: number;
  needsInspection?: boolean;
  notes?: string;
}

export interface Rehab {
  lineItems: RehabLineItem[];
  contingencyPct: number; // 0.10 - 0.20 default range per spec
}

export interface RentComp {
  id: string;
  address: string;
  rent: number;
  bedrooms?: number;
  sqft?: number;
}

export interface MarketRent {
  conservativeRent?: ValuedField<number>;
  likelyRent?: ValuedField<number>;
  upperRent?: ValuedField<number>;
  comparables: RentComp[];
}

export interface Section8Analysis {
  zip?: string;
  paymentStandard?: ValuedField<number>;
  utilityAllowance?: ValuedField<number>;
  contractRentCeiling?: ValuedField<number>;
  recommendedAskingRent?: ValuedField<number>;
  inspectionStatus?: "PASSED" | "PENDING" | "NOT_SCHEDULED" | "FAILED";
  rentReasonablenessStatus?: "LIKELY_PASS" | "AT_RISK" | "UNKNOWN";
}

export interface Rent {
  market: MarketRent;
  section8?: Section8Analysis;
}

export interface HardMoneyTerms {
  ratePct: number; // annual interest rate, e.g. 0.11
  points: number; // e.g. 2 = 2 points
  purchaseFinancedPct: number; // % of purchase price financed
  rehabFinancedPct: number; // % of rehab financed
  ltcCapPct?: number; // loan-to-cost cap
  arvLtvCapPct?: number; // ARV loan-to-value cap
  minLoan?: number;
  maxLoan?: number;
  drawFee?: number;
  appraisalFee?: number;
  underwritingFee?: number;
  otherFees?: number;
  termMonths: number;
  rehabInterestOnFullCommitment?: boolean; // interest on committed vs. drawn balance
}

export interface RefinanceTerms {
  refiLtvPct: number;
  ratePct: number;
  termYears: number;
  closingCostsPct: number;
  seasoningMonths?: number;
  minDscr?: number;
}

export interface OperatingExpenseAssumptions {
  taxesAnnual: number;
  insuranceAnnual: number;
  vacancyPct: number;
  maintenancePct: number;
  capexPct: number;
  managementPct: number;
  hoaMonthly?: number;
  otherMonthly?: number;
}

export interface Financing {
  hardMoney: HardMoneyTerms;
  refinance: RefinanceTerms;
  expenses: OperatingExpenseAssumptions;
  holdPeriodMonths: number;
}

export interface InvestorRequirements {
  minMonthlyCashFlowPerDoor: number;
  maxCashLeftInPropertyAfterRefi: number;
  minEquityCreatedPct: number;
  reservesRequired: number;
}

export interface DealKillerFlag {
  key: string;
  label: string;
  status: "OK" | "FLAGGED" | "STOP";
  note?: string;
}

export interface LenderTerms extends HardMoneyTerms {
  quoteSource?: "DIRECT_QUOTE" | "ADVERTISED";
}
