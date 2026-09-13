import { describe, expect, it } from "vitest";
import { topPriorities, type PriorityCandidate } from "../priorities";

const NOW = new Date("2026-09-13T12:00:00Z");

describe("topPriorities", () => {
  it("returns at most 3 items even with many candidates", () => {
    const candidates: PriorityCandidate[] = Array.from({ length: 10 }, (_, i) => ({
      id: `c${i}`, kind: "ADMIN", label: `item ${i}`,
    }));
    expect(topPriorities(candidates, NOW)).toHaveLength(3);
  });

  it("ranks an overdue deadline above one with no deadline at all", () => {
    const overdue: PriorityCandidate = { id: "a", kind: "LEAD", label: "overdue", deadlineDate: new Date("2020-01-01") };
    const none: PriorityCandidate = { id: "b", kind: "ADMIN", label: "no deadline" };
    const [first] = topPriorities([none, overdue], NOW, 1);
    expect(first!.id).toBe("a");
  });

  it("ranks a dependency item above an equivalent non-dependency item", () => {
    const dep: PriorityCandidate = { id: "a", kind: "DEAL", label: "blocks someone", isDependency: true };
    const plain: PriorityCandidate = { id: "b", kind: "DEAL", label: "no blocker" };
    const [first] = topPriorities([plain, dep], NOW, 1);
    expect(first!.id).toBe("a");
  });

  it("ranks higher revenue impact above lower revenue impact, all else equal", () => {
    const high: PriorityCandidate = { id: "a", kind: "DEAL", label: "big deal", revenueImpact: 3 };
    const low: PriorityCandidate = { id: "b", kind: "DEAL", label: "small deal", revenueImpact: 1 };
    const [first] = topPriorities([low, high], NOW, 1);
    expect(first!.id).toBe("a");
  });
});
