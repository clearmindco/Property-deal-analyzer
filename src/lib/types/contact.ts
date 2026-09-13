// Unified CRM contact types (Master Build Prompt section 1). A Contact is a person, never a
// property -- one person can hold multiple roles at once and be linked to multiple deals
// (properties), and must never be duplicated just because they wear another hat or send
// another property.

export type ContactRole =
  | "SELLER"
  | "REALTOR"
  | "WHOLESALER"
  | "INVESTOR"
  | "REFERRAL"
  | "LENDER"
  | "CONTRACTOR"
  | "PROPERTY_MANAGER"
  | "ATTORNEY"
  | "UNKNOWN";

export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  SELLER: "Direct Seller",
  REALTOR: "Realtor / Agent",
  WHOLESALER: "Wholesaler / Deal Source",
  INVESTOR: "Investor",
  REFERRAL: "Referral / Network Contact",
  LENDER: "Lender",
  CONTRACTOR: "Contractor",
  PROPERTY_MANAGER: "Property Manager",
  ATTORNEY: "Attorney",
  UNKNOWN: "Unknown",
};

export const CONTACT_ROLES: ContactRole[] = [
  "SELLER", "REALTOR", "WHOLESALER", "INVESTOR", "REFERRAL", "LENDER", "CONTRACTOR",
  "PROPERTY_MANAGER", "ATTORNEY", "UNKNOWN",
];

export type ContractorCategory = "PREFERRED" | "BACKUP" | "DO_NOT_USE";

export type PreferredContactMethod = "CALL" | "TEXT" | "FACEBOOK_DM" | "EMAIL";

export const PREFERRED_CONTACT_METHOD_LABELS: Record<PreferredContactMethod, string> = {
  CALL: "Call", TEXT: "Text", FACEBOOK_DM: "Facebook DM", EMAIL: "Email",
};

export type RelationshipStatus = "ACTIVE" | "COLD" | "DO_NOT_CONTACT";

export const RELATIONSHIP_STATUS_LABELS: Record<RelationshipStatus, string> = {
  ACTIVE: "Active", COLD: "Cold", DO_NOT_CONTACT: "Do not contact",
};

export function parseRoles(raw: string | null | undefined): ContactRole[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((r): r is ContactRole => CONTACT_ROLES.includes(r)) : [];
  } catch {
    return [];
  }
}
