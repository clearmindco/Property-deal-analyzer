import { describe, expect, it } from "vitest";
import { findStaleRecords, type StaleDealInput, type StaleLeadInput } from "../staleness";

function deal(overrides: Partial<StaleDealInput> = {}): StaleDealInput {
  return {
    id: "d1", address: "123 Main St", stage: "ANALYZING", nextAction: "Call seller",
    nextActionOwner: "US", followUpCadence: "ONE_WEEK", dealKillers: [],
    ...overrides,
  };
}

function lead(overrides: Partial<StaleLeadInput> = {}): StaleLeadInput {
  return {
    id: "l1", sellerName: "Jane Seller", status: "TALKING", nextAction: "Text back",
    nextActionOwner: "US", nextFollowUpAt: new Date("2099-01-01"),
    ...overrides,
  };
}

describe("findStaleRecords", () => {
  it("flags a deal with no next action, owner, or cadence", () => {
    const records = findStaleRecords([deal({ nextAction: null, nextActionOwner: null, followUpCadence: null })], []);
    expect(records).toHaveLength(1);
    expect(records[0]!.reasons).toContain("No next action set");
    expect(records[0]!.reasons).toContain("No owner assigned for the next response");
    expect(records[0]!.reasons).toContain("No follow-up cadence set");
  });

  it("flags a deal with unresolved deal-killer flags", () => {
    const records = findStaleRecords(
      [deal({ dealKillers: [{ key: "title", label: "Unclear title", status: "FLAGGED" }] })],
      []
    );
    expect(records[0]!.reasons.some((r) => r.includes("Unclear title"))).toBe(true);
  });

  it("does not flag a fully-healthy deal", () => {
    expect(findStaleRecords([deal()], [])).toHaveLength(0);
  });

  it("never flags a CLOSED or DEAD deal even if empty", () => {
    const records = findStaleRecords(
      [deal({ stage: "CLOSED", nextAction: null, nextActionOwner: null, followUpCadence: null })],
      []
    );
    expect(records).toHaveLength(0);
  });

  it("flags a lead with an overdue follow-up", () => {
    const records = findStaleRecords([], [lead({ nextFollowUpAt: new Date("2020-01-01") })]);
    expect(records[0]!.reasons.some((r) => r.includes("overdue"))).toBe(true);
  });

  it("flags a lead with no follow-up date at all", () => {
    const records = findStaleRecords([], [lead({ nextFollowUpAt: null })]);
    expect(records[0]!.reasons).toContain("No follow-up date set");
  });

  it("never flags a DEAD lead", () => {
    const records = findStaleRecords([], [lead({ status: "DEAD", nextAction: null, nextActionOwner: null, nextFollowUpAt: null })]);
    expect(records).toHaveLength(0);
  });
});
