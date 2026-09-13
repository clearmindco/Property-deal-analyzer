import type {
  CreativeFinance, HardMoneyTerms, InvestorRequirements, OperatingExpenseAssumptions,
  RefinanceTerms, SourceType,
} from "./deal";
import type { DscrRentalTerms } from "@/lib/calc/dscrRental";
import type { WrapTerms } from "@/lib/calc/wrapFinancing";

// Master Deal Structuring Engine: test every viable path, regardless of where the lead came
// from. A lead source and a deal structure are two different things -- these types exist so
// that distinction is enforced in code, not just in a comment.

export type StrategyId =
  | "CASH_PURCHASE" | "BRRRR" | "DSCR_RENTAL" | "SELLER_FINANCE" | "SUBJECT_TO" | "HYBRID"
  | "WRAP" | "LEASE_OPTION" | "WHOLESALE_ASSIGNMENT" | "DOUBLE_CLOSE" | "RENEGOTIATED_WHOLESALE";

export const STRATEGY_LABELS: Record<StrategyId, string> = {
  CASH_PURCHASE: "Cash Purchase",
  BRRRR: "BRRRR",
  DSCR_RENTAL: "Conventional / DSCR Rental Purchase",
  SELLER_FINANCE: "Seller Financing",
  SUBJECT_TO: "Subject-To Existing Financing",
  HYBRID: "Hybrid (existing debt + seller-carried equity)",
  WRAP: "Wrap / Wraparound Financing",
  LEASE_OPTION: "Lease Option",
  WHOLESALE_ASSIGNMENT: "Wholesale / Assignment",
  DOUBLE_CLOSE: "Double Close",
  RENEGOTIATED_WHOLESALE: "Renegotiated Wholesale Contract",
};

export const ALL_STRATEGIES: StrategyId[] = [
  "CASH_PURCHASE", "BRRRR", "DSCR_RENTAL", "SELLER_FINANCE", "SUBJECT_TO", "HYBRID", "WRAP",
  "LEASE_OPTION", "WHOLESALE_ASSIGNMENT", "DOUBLE_CLOSE", "RENEGOTIATED_WHOLESALE",
];

/** "Seller cooperation" structures require either direct access to the seller or documented
 * authority over a wholesaler's contract -- see strategyAvailability.ts. */
export const SELLER_COOPERATION_STRATEGIES: StrategyId[] = ["SELLER_FINANCE", "SUBJECT_TO", "HYBRID", "WRAP", "LEASE_OPTION"];

export type TriState = "YES" | "NO" | null;

/** Who actually controls the deal -- the facts the authority gate checks before ever showing a
 * seller-cooperation structure as available. Unknown must never be treated as yes. */
export interface ContractControlFacts {
  sourceType: SourceType | null;
  assignmentPermitted: boolean | null;
  sellerApprovalForTerms: TriState;
  wholesalerControlsContract: TriState;
}

export interface StrategyAvailability {
  strategy: StrategyId;
  available: boolean;
  reason: string;
}

export type StrategyVerdict = "PASS" | "FAIL" | "NEEDS_INFO";

export interface RescueOption {
  label: string;
  description: string;
}

export interface StrategyResult {
  strategy: StrategyId;
  available: boolean;
  availabilityReason: string;
  verdict: StrategyVerdict;
  monthlyCashFlow: number | null;
  cashRequired: number | null;
  risk: "LOW" | "MODERATE" | "HIGH" | null;
  reasoning: string[];
  rescueOptions: RescueOption[];
}

export interface BestDealRouterResult {
  ranked: StrategyResult[];
  recommended: StrategyResult | null;
  backup: StrategyResult | null;
  alternativeExit: StrategyResult | null;
  walkAwayPoint: string;
  nextInformationNeeded: string[];
}

/** Everything the orchestrator needs to test every strategy on one property. Reuses the exact
 * terms shapes already used elsewhere in the app (CreativeFinance from the Creative Finance
 * tab, HardMoney/Refinance from the Financing tab) rather than inventing parallel input types. */
export interface StrategyEngineInputs {
  arv: number;
  rehabTotal: number;
  rentMonthly: number;
  expenses: OperatingExpenseAssumptions;
  askingPrice: number | undefined;
  hardMoneyTerms: HardMoneyTerms;
  refinanceTerms: RefinanceTerms;
  holdPeriodMonths: number;
  requirements: InvestorRequirements;
  creativeFinance: CreativeFinance;
  contractControl: ContractControlFacts;
  dscrTerms?: DscrRentalTerms;
  wrapTerms?: WrapTerms;
  targetCashFlow: number;
  currentTotalAcquisitionPrice?: number;
  wholesaleEndBuyerMaxPrice?: number;
}
