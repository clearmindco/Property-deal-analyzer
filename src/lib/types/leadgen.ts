// Types for the Facebook/community inbound seller lead-generation module.

export type GroupType =
  | "community" | "neighborhood" | "buy_sell_trade" | "landlord" | "property_owner"
  | "real_estate" | "investor" | "vacation_rental" | "local_business" | "other";

export type GroupPriority = "HIGH_PRIORITY" | "TEST" | "LOW_PRIORITY" | "STOP_USING";

export type ActivityLevel = "HIGH" | "MEDIUM" | "LOW";

export type PostType =
  | "seasoning_community" | "looking_for_property" | "fixer_upper" | "small_multifamily"
  | "rental_property" | "tired_landlord" | "vacation_rental" | "general_seller" | "referral";

export type PostStatus = "DRAFT" | "POSTED" | "SKIPPED";

export type ResponseOutcome = "NONE" | "COMMENT" | "DIRECT_MESSAGE" | "SELLER_LEAD";

export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  community: "Community",
  neighborhood: "Neighborhood",
  buy_sell_trade: "Buy/Sell/Trade",
  landlord: "Landlord",
  property_owner: "Property Owner",
  real_estate: "Real Estate",
  investor: "Investor",
  vacation_rental: "Vacation Rental",
  local_business: "Local Business",
  other: "Other",
};

export const POST_TYPE_LABELS: Record<PostType, string> = {
  seasoning_community: "Seasoning / Community",
  looking_for_property: "Looking for Property",
  fixer_upper: "Fixer-Upper",
  small_multifamily: "Small Multifamily",
  rental_property: "Rental Property",
  tired_landlord: "Tired Landlord",
  vacation_rental: "Vacation Rental",
  general_seller: "General Seller",
  referral: "Referral / Anyone Know Someone?",
};

// The ~12 facts the spec asks us to gradually collect from a seller (section: SELLER
// QUALIFICATION). Order matters -- it's the order "next best question" walks through.
export const QUALIFICATION_FIELDS = [
  { key: "propertyType", label: "Property type" },
  { key: "sellerReason", label: "Why are they selling?" },
  { key: "timeline", label: "How soon do they want to sell?" },
  { key: "condition", label: "What condition is it in?" },
  { key: "occupancy", label: "Is it occupied or vacant?" },
  { key: "currentRent", label: "What's the current rent (if any)?" },
  { key: "mortgageBalance", label: "Mortgage balance" },
  { key: "interestRate", label: "Mortgage interest rate" },
  { key: "monthlyPayment", label: "Monthly mortgage payment" },
  { key: "taxes", label: "Annual property taxes" },
  { key: "liensDebts", label: "Any liens or other debts on the property?" },
  { key: "askingPrice", label: "What are they hoping to get for it?" },
  { key: "cashNeeded", label: "How much cash do they need at closing?" },
  { key: "openToTerms", label: "Would they consider payments/terms instead of all cash?" },
  { key: "repairs", label: "What repairs does it need?" },
  { key: "legalCoIssues", label: "Any legal or Certificate of Occupancy issues?" },
] as const;

export type QualificationKey = (typeof QUALIFICATION_FIELDS)[number]["key"];

export interface QualificationAnswer {
  key: QualificationKey;
  value: string;
  source: "manual" | "voice" | "seller_message";
  confirmed: boolean;
}

export type LeadPriorityLevel = "STRONG" | "MODERATE" | "UNCLEAR";

export interface LeadPriorityResult {
  level: LeadPriorityLevel;
  reasons: string[];
}

export interface GroupPerformance {
  posts: number;
  responses: number;
  leads: number;
  qualifiedLeads: number;
  calls: number;
  offers: number;
  contracts: number;
  closedDeals: number;
  responsePerPost: number;
  leadPerPost: number;
  qualifiedLeadRate: number;
  offerRate: number;
  contractRate: number;
  recommendation: "KEEP POSTING" | "KEEP TESTING" | "REVIEW APPROACH" | "STOP USING" | "NOT ENOUGH DATA";
}
