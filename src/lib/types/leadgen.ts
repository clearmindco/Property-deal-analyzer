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

// Every underlying fact the seller conversation engine can capture. Grouped below into the
// 10 CORE QUESTIONS (spec: "Seller Conversation Engine / 10 Magic Questions System") -- this
// flat list is field metadata (label, for manual entry and lookups); CORE_QUESTIONS below
// is what actually drives "next best question" and the X/10 progress count.
export const QUALIFICATION_FIELDS = [
  { key: "propertyType", label: "Property type" },
  { key: "zip", label: "ZIP code" },
  { key: "unitCount", label: "Unit count" },
  { key: "occupancy", label: "Occupancy / current use" },
  { key: "propertyStory", label: "General property story" },
  { key: "sellerReason", label: "Why are they selling?" },
  { key: "timeline", label: "How soon do they want to sell?" },
  { key: "condition", label: "What condition is it in?" },
  { key: "repairs", label: "What repairs does it need?" },
  { key: "legalCoIssues", label: "Any legal or Certificate of Occupancy issues?" },
  { key: "liensDebts", label: "Anything owed besides the mortgage (solar, contractor lien, roof financing, HELOC, judgment, tax lien)?" },
  { key: "taxStatus", label: "Are property taxes current or delinquent?" },
  { key: "taxes", label: "Property taxes (annual amount, or amount delinquent)" },
  { key: "mortgageBalance", label: "Mortgage balance" },
  { key: "secondMortgageHeloc", label: "Second mortgage / HELOC / other secured debt" },
  { key: "askingPrice", label: "What are they hoping to get for it?" },
  { key: "cashNeeded", label: "How much cash do they need at closing?" },
  { key: "monthlyPayment", label: "Total monthly mortgage payment" },
  { key: "interestRate", label: "Mortgage interest rate" },
  { key: "loanType", label: "Loan type (conventional, FHA, VA, USDA, etc.)" },
  { key: "remainingTerm", label: "Remaining loan term" },
  { key: "escrowStatus", label: "Escrowed for taxes/insurance?" },
  { key: "arrears", label: "Any arrears on the mortgage?" },
  { key: "pitiBreakdown", label: "PITI breakdown (principal/interest/taxes/insurance/HOA), if known" },
  { key: "termsResponse", label: "Open to receiving payments over time instead of all cash?" },
  { key: "openToTerms", label: "Seller's own words on terms" },
  { key: "currentRent", label: "Current rent (if tenant-occupied)" },
] as const;

export type QualificationKey = (typeof QUALIFICATION_FIELDS)[number]["key"];

export interface QualificationAnswer {
  key: QualificationKey;
  value: string;
  source: "manual" | "voice" | "seller_message";
  confirmed: boolean;
}

// The 10 core seller-discovery questions. Do not show all ten to the seller at once --
// "next best question" walks this list in order, skipping any question where at least one
// of its underlying fields is already answered (so a seller who volunteers information
// out of order is never asked for it twice).
export interface CoreQuestion {
  id: number;
  /** Short 2-3 word label used in "you already know..." resume summaries. */
  topic: string;
  question: string;
  purpose: string;
  fields: QualificationKey[];
  /** Q9 (payment + rate) is an underwriting addition to OUR system, not the source framework. */
  origin: "source_framework" | "underwriting_addition";
}

export const CORE_QUESTIONS: CoreQuestion[] = [
  {
    id: 1,
    topic: "property overview",
    question: "Tell me a little about the property.",
    purpose: "Start broad and let the seller talk -- this often volunteers several answers at once.",
    fields: ["propertyType", "zip", "unitCount", "occupancy", "propertyStory"],
    origin: "source_framework",
  },
  {
    id: 2,
    topic: "motivation",
    question: "Why are you thinking about selling?",
    purpose: "Discover the seller's actual motivation, in their own words.",
    fields: ["sellerReason"],
    origin: "source_framework",
  },
  {
    id: 3,
    topic: "timeline",
    question: "How soon are you looking to sell?",
    purpose: "Determine timeline. Urgency alone doesn't make it a good deal.",
    fields: ["timeline"],
    origin: "source_framework",
  },
  {
    id: 4,
    topic: "condition",
    question: "Does the house need any work before a family with young kids could move in?",
    purpose: "Get condition described naturally rather than asking for an investor-style rehab estimate.",
    fields: ["condition", "repairs", "legalCoIssues"],
    origin: "source_framework",
  },
  {
    id: 5,
    topic: "other debts",
    question: "Is anything owed on the property besides the mortgage -- contractors, solar, roof financing, liens, or anything similar?",
    purpose: "Identify obligations that could materially affect closing or cost of entry.",
    fields: ["liensDebts"],
    origin: "source_framework",
  },
  {
    id: 6,
    topic: "tax status",
    question: "Are the property taxes current, or is anything behind?",
    purpose: "Identify potential tax arrears -- still needs independent verification either way.",
    fields: ["taxStatus", "taxes"],
    origin: "source_framework",
  },
  {
    id: 7,
    topic: "mortgage balance",
    question: "About how much is left on the mortgage?",
    purpose: "Understand approximate equity and existing debt. Don't pressure a seller who doesn't know the exact amount.",
    fields: ["mortgageBalance", "secondMortgageHeloc"],
    origin: "source_framework",
  },
  {
    id: 8,
    topic: "price expectation",
    question: "What are you hoping to get for the property?",
    purpose: "Let the seller state their price. Never reveal your maximum acquisition price -- they're separate numbers.",
    fields: ["askingPrice", "cashNeeded"],
    origin: "source_framework",
  },
  {
    id: 9,
    topic: "payment & rate",
    question: "Do you happen to know your current monthly mortgage payment and interest rate?",
    purpose: "An underwriting addition to our system (not the original source framework) -- payment and rate are essential for evaluating any payment-based creative-finance structure.",
    fields: ["monthlyPayment", "interestRate", "loanType", "remainingTerm", "escrowStatus", "arrears", "pitiBreakdown"],
    origin: "underwriting_addition",
  },
  {
    id: 10,
    topic: "openness to terms",
    question: "If I could make your price work, buy the property as-is, and handle the closing costs, would you be open to receiving your money over time or doing it on payments?",
    purpose: "Determine openness to terms in plain English -- no jargon yet. A yes is not automatically a deal.",
    fields: ["termsResponse", "openToTerms"],
    origin: "source_framework",
  },
];

export type LeadPriorityLevel = "STRONG" | "MODERATE" | "UNCLEAR";

export interface LeadPriorityResult {
  level: LeadPriorityLevel;
  reasons: string[];
}

export type TermsResponse = "OPEN_TO_TERMS" | "MAYBE_NEEDS_EXPLANATION" | "CASH_ONLY" | "UNKNOWN";

export type StrategyLane =
  | "CASH_BRRRR" | "SELLER_FINANCE" | "SUBJECT_TO" | "HYBRID" | "LEASE_OPTION"
  | "WHOLESALE" | "WHOLETAIL" | "TRADITIONAL_PURCHASE" | "FOLLOW_UP" | "PASS";

export const STRATEGY_LANE_LABELS: Record<StrategyLane, string> = {
  CASH_BRRRR: "Cash / BRRRR",
  SELLER_FINANCE: "Seller Finance",
  SUBJECT_TO: "Subject-To",
  HYBRID: "Hybrid (existing debt + seller equity financing)",
  LEASE_OPTION: "Lease Option",
  WHOLESALE: "Wholesale",
  WHOLETAIL: "Wholetail",
  TRADITIONAL_PURCHASE: "Traditional Purchase",
  FOLLOW_UP: "Follow-Up",
  PASS: "Pass",
};

export interface StrategyRouterResult {
  recommended: StrategyLane[];
  reasoning: string[];
  needsMoreInfo: boolean;
}

/** The verification checklist shown once a seller says yes to terms -- spec:
 * "MAJOR SYSTEM GATE. DO NOT SIGN YET." Nothing here is checked automatically. */
export const VERIFICATION_CHECKLIST_ITEMS = [
  "Mortgage statement", "Exact loan balance", "Interest rate", "Monthly payment",
  "PITI breakdown", "Arrears", "Loan type", "Loan documents when appropriate", "Title",
  "Liens", "Taxes", "Insurance", "Property condition", "Legal use", "Certificate of Occupancy",
  "Market value", "Rent", "Seller cash requirement", "Seller equity owed", "Cost of entry",
  "Exit strategy", "Reserves", "Attorney/title review", "State-specific requirements",
] as const;

export interface VerificationChecklistItem {
  item: string;
  checked: boolean;
}

export interface ObjectionEntry {
  key: string;
  label: string;
  objectionExample: string;
  suggestedResponse: string;
  purpose: string;
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
