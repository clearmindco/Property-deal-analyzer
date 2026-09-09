import { describe, expect, it } from "vitest";
import { compareLenders } from "../lenderCompare";
import { DEMO_FINANCING, DEMO_PURCHASE_PRICE, DEMO_VALUE_ARV, demoRehabTotal } from "@/lib/demoData";

describe("compareLenders", () => {
  const arv = DEMO_VALUE_ARV.brrrUnderwritingArv!.value;
  const rehabTotal = demoRehabTotal();

  it("picks the cheaper lender as best fit when both qualify", () => {
    const cheapLender = { id: "cheap", name: "Cheap Capital", terms: DEMO_FINANCING.hardMoney, verified: true };
    const expensiveLender = {
      id: "expensive",
      name: "Expensive Capital",
      terms: { ...DEMO_FINANCING.hardMoney, points: 5, underwritingFee: 3000 },
      verified: true,
    };

    const result = compareLenders(DEMO_PURCHASE_PRICE, rehabTotal, arv, DEMO_FINANCING.holdPeriodMonths, [
      cheapLender, expensiveLender,
    ]);

    expect(result.bestFitLenderId).toBe("cheap");
  });

  it("disqualifies a lender whose minimum loan the deal does not meet", () => {
    const tooSmallLender = {
      id: "min-too-high",
      name: "Big Minimum Capital",
      terms: { ...DEMO_FINANCING.hardMoney, minLoan: 500000 },
      verified: true,
    };
    const result = compareLenders(DEMO_PURCHASE_PRICE, rehabTotal, arv, DEMO_FINANCING.holdPeriodMonths, [tooSmallLender]);
    expect(result.rows[0]!.loan.qualifies).toBe(false);
  });
});
