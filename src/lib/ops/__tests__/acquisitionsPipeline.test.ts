import { describe, expect, it } from "vitest";
import { summarizeAcquisitionsPipeline, type PipelineLeadInput } from "../acquisitionsPipeline";

function lead(overrides: Partial<PipelineLeadInput> = {}): PipelineLeadInput {
  return {
    id: "l1", sellerName: "Jane Seller", status: "TALKING", leadType: null,
    lastContactAt: new Date(), nextFollowUpAt: new Date("2099-01-01"),
    ...overrides,
  };
}

describe("summarizeAcquisitionsPipeline", () => {
  it("buckets leads by status", () => {
    const summary = summarizeAcquisitionsPipeline([lead({ status: "NEW" }), lead({ status: "NEW" }), lead({ status: "QUALIFIED" })]);
    expect(summary.byStatus).toEqual({ NEW: 2, QUALIFIED: 1 });
  });

  it("surfaces overdue follow-ups", () => {
    const summary = summarizeAcquisitionsPipeline([lead({ nextFollowUpAt: new Date("2020-01-01") })]);
    expect(summary.overdueFollowUps).toHaveLength(1);
  });

  it("flags an active conversation with no recent contact as stale", () => {
    const summary = summarizeAcquisitionsPipeline([lead({ status: "TALKING", lastContactAt: new Date("2020-01-01") })]);
    expect(summary.staleActiveConversations).toHaveLength(1);
    expect(summary.ignoreNewLeadGenReason).not.toBeNull();
  });

  it("does not flag a recently-contacted active conversation", () => {
    const summary = summarizeAcquisitionsPipeline([lead({ status: "TALKING", lastContactAt: new Date() })]);
    expect(summary.staleActiveConversations).toHaveLength(0);
    expect(summary.ignoreNewLeadGenReason).toBeNull();
  });

  it("does not flag a NEW lead (not yet an active conversation) as stale", () => {
    const summary = summarizeAcquisitionsPipeline([lead({ status: "NEW", lastContactAt: null })]);
    expect(summary.staleActiveConversations).toHaveLength(0);
  });
});
