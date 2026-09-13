import { describe, expect, it } from "vitest";
import { resolveTotalAcquisitionPrice } from "@/lib/calc/acquisitionTotal";

describe("wholesaler acquisition total", () => {
  it("adds the assignment fee on top of the contract price -- never hides it", () => {
    const result = resolveTotalAcquisitionPrice(54000, 1500);
    expect(result.contractPrice).toBe(54000);
    expect(result.assignmentFee).toBe(1500);
    expect(result.totalAcquisitionPrice).toBe(55500);
  });

  it("treats a missing assignment fee as zero, not as an error", () => {
    const result = resolveTotalAcquisitionPrice(54000, null);
    expect(result.totalAcquisitionPrice).toBe(54000);
  });

  it("treats a missing contract price as zero", () => {
    const result = resolveTotalAcquisitionPrice(undefined, 1500);
    expect(result.totalAcquisitionPrice).toBe(1500);
  });
});
