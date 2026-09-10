import { describe, expect, it } from "vitest";
import { resolveJurisdiction } from "@/lib/legal/jurisdiction";

describe("jurisdiction resolution", () => {
  it("maps Rochester to Monroe County", () => {
    expect(resolveJurisdiction("123 Main St, Rochester, NY 14608")).toEqual({ state: "NY", county: "Monroe", municipality: "Rochester" });
  });

  it("maps Buffalo to Erie County", () => {
    expect(resolveJurisdiction("45 Elm St, Buffalo, NY 14201").county).toBe("Erie");
  });

  it("maps Syracuse to Onondaga County", () => {
    expect(resolveJurisdiction("9 Oak Ave, Syracuse, NY 13202").county).toBe("Onondaga");
  });

  it("falls back to a generic NY record for an unrecognized market", () => {
    expect(resolveJurisdiction("1 Random Rd, Albany, NY 12207")).toEqual({ state: "NY", county: "", municipality: "" });
  });
});
