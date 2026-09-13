// Prisma's SQLite connector has no native Json column type, so every structured field on
// Deal/Lender/Lead is stored as a TEXT column holding JSON. These helpers are the single
// place that serializes on the way in and deserializes on the way out.

export const DEAL_JSON_FIELDS = [
  "property", "seller", "valueArv", "rehab", "rent", "financing",
  "creativeFinance", "assumptions", "dealKillers",
] as const;

export const LENDER_JSON_FIELDS = ["terms"] as const;

export const LEAD_JSON_FIELDS = [
  "motivation", "details", "qualification", "priorityReasons", "skippedQuestions", "verificationChecklist",
] as const;

export const LEGAL_CASE_JSON_FIELDS = [
  "intake", "triggerResult", "requiredDocuments", "attorneySummary",
] as const;

export const TEMPLATE_VERSION_JSON_FIELDS = ["clauses"] as const;

export const GENERATED_DOCUMENT_JSON_FIELDS = ["fieldsSnapshot"] as const;

export const CONTACT_JSON_FIELDS = ["roles"] as const;

export const COURSE_RULE_JSON_FIELDS = ["details"] as const;

// Returns Record<string, unknown> rather than T: the whole point is that the JSON fields
// change shape (object -> string), so preserving the input type here would be a lie. Callers
// pass the result straight to Prisma, whose generated input types expect the string shape.
export function serializeJsonFields<T extends Record<string, unknown>>(
  data: T,
  fields: readonly string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data };
  for (const field of fields) {
    if (field in result) {
      const value = result[field];
      result[field] = value === null || value === undefined ? value : JSON.stringify(value);
    }
  }
  return result;
}

export function deserializeJsonFields<T extends Record<string, unknown>>(
  record: T,
  fields: readonly string[]
): T {
  const result: Record<string, unknown> = { ...record };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string") {
      try {
        result[field] = JSON.parse(value);
      } catch {
        // leave as-is if it somehow isn't valid JSON
      }
    }
  }
  return result as T;
}
