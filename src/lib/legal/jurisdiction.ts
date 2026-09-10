// Jurisdiction Engine -- resolves state/county/municipality from a free-text address.
// Initial jurisdiction is New York State only (per product spec), with named-market shortcuts
// for the three initial target markets. Everything else falls back to a generic NY record so
// the rest of the legal pipeline always has *a* jurisdiction to key rules off of, without
// pretending to know a county it hasn't been told.

export interface ResolvedJurisdiction {
  state: string;
  /** "" means not yet resolved to a specific county -- kept as an empty string rather than
   * null so it works cleanly as part of Prisma's compound unique key on Jurisdiction. */
  county: string;
  municipality: string;
}

const CITY_TO_COUNTY: { pattern: RegExp; county: string; municipality: string }[] = [
  { pattern: /rochester/i, county: "Monroe", municipality: "Rochester" },
  { pattern: /buffalo/i, county: "Erie", municipality: "Buffalo" },
  { pattern: /syracuse/i, county: "Onondaga", municipality: "Syracuse" },
];

export function resolveJurisdiction(address: string | null | undefined): ResolvedJurisdiction {
  const text = address ?? "";
  for (const { pattern, county, municipality } of CITY_TO_COUNTY) {
    if (pattern.test(text)) {
      return { state: "NY", county, municipality };
    }
  }
  return { state: "NY", county: "", municipality: "" };
}
