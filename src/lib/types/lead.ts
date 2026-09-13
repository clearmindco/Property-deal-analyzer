// Lead-type routing (AR Residential Operating System, Acquisitions Director section). This is
// deliberately separate from Deal's `SourceType` and Contact's `ContactRole[]` -- Lead remains
// its own model. Its purpose here is narrow: know whether the person on a Lead record actually
// owns the property before running homeowner-motivation questions on them.

export type LeadType = "DIRECT_SELLER" | "REALTOR" | "WHOLESALER" | "REFERRAL" | "UNKNOWN";

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  DIRECT_SELLER: "Direct Seller",
  REALTOR: "Realtor / Agent",
  WHOLESALER: "Wholesaler / Deal Source",
  REFERRAL: "Referral / Network",
  UNKNOWN: "Unknown",
};

export const LEAD_TYPES: LeadType[] = ["DIRECT_SELLER", "REALTOR", "WHOLESALER", "REFERRAL", "UNKNOWN"];
