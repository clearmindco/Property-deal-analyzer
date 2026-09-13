import { describe, expect, it } from "vitest";
import { buildCeoBrief, type CompanyObjectiveInput } from "../ceoPriorities";
import type { BottleneckResult } from "../bottleneck";

const bottleneck: BottleneckResult = { label: "NONE_IDENTIFIED", explanation: "", recommendation: "Keep executing." };

function objective(overrides: Partial<CompanyObjectiveInput> = {}): CompanyObjectiveInput {
  return { period: "WEEK", periodLabel: "2026-W38", type: "PRIMARY", text: "Move 3 qualified sellers onto calls.", ...overrides };
}

describe("buildCeoBrief", () => {
  it("separates primary, secondary, and do-not-prioritize objectives", () => {
    const brief = buildCeoBrief(
      [
        objective({ type: "PRIMARY", text: "Primary goal" }),
        objective({ type: "SECONDARY", text: "Secondary goal" }),
        objective({ type: "DO_NOT_PRIORITIZE", text: "Skip this" }),
      ],
      "2026-W38",
      bottleneck
    );
    expect(brief.primaryObjectives).toEqual(["Primary goal"]);
    expect(brief.secondaryObjectives).toEqual(["Secondary goal"]);
    expect(brief.doNotPrioritize).toEqual(["Skip this"]);
  });

  it("only includes objectives matching the current period, never a stale prior week's", () => {
    const brief = buildCeoBrief([objective({ periodLabel: "2026-W37" })], "2026-W38", bottleneck);
    expect(brief.primaryObjectives).toHaveLength(0);
  });

  it("carries the current bottleneck through unchanged", () => {
    const brief = buildCeoBrief([], "2026-W38", bottleneck);
    expect(brief.bottleneck.label).toBe("NONE_IDENTIFIED");
  });
});
