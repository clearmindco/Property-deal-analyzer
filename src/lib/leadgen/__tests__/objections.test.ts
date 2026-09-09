import { describe, expect, it } from "vitest";
import { listObjections, matchObjection, OBJECTIONS } from "../objections";

describe("objections", () => {
  it("lists all 8 scripted objections from the spec", () => {
    expect(listObjections()).toHaveLength(8);
  });

  it("matches a seller's cash-only objection to the right scripted response", () => {
    const match = matchObjection("Honestly I need all my money at closing, I can't do payments.");
    expect(match?.key).toBe("needs_all_cash");
    expect(match?.suggestedResponse).toMatch(/specific amount you need immediately/i);
  });

  it("matches the subject-to objection and never promises the bank won't care", () => {
    const match = matchObjection("Wait, are you taking over my mortgage?");
    expect(match?.key).toBe("taking_over_mortgage");
    // The actual script sent to the seller must never make these claims -- the purpose
    // field is allowed to name them as things NOT to say (instructions to the investor).
    expect(match!.suggestedResponse).not.toMatch(/bank won'?t care|no risk|land trust fixes/i);
  });

  it("returns null for text that matches no known objection", () => {
    expect(matchObjection("The kitchen was remodeled two years ago.")).toBeNull();
  });

  it("never lets the risk-minimizing responses claim there is no risk", () => {
    for (const o of OBJECTIONS) {
      expect(o.suggestedResponse).not.toMatch(/no risk|guarantee/i);
    }
  });
});
