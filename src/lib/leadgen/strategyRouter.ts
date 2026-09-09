import type { LeadPriorityResult, QualificationAnswer, StrategyLane, StrategyRouterResult } from "@/lib/types/leadgen";
import { answerFor, parseMoneyString } from "./qualification";

const NEEDS_WORK_WORDS = /fixer|needs work|rough|bad shape|major|roof|foundation|water|leak|mold|outdated/i;
const GOOD_CONDITION_WORDS = /good condition|move[- ]in ready|updated|renovated|new roof|newer/i;

/**
 * Evaluates the seller conversation so far and routes to one or more of the 10 strategy
 * lanes, with the reasoning that produced each one. This never picks creative finance by
 * default -- CASH_ONLY takes it off the table entirely, and PASS is always a legitimate
 * output when the economics or risk don't support anything else (spec: "PASS is a
 * successful outcome when the economics or risk do not work").
 */
export function routeStrategy(
  qualification: QualificationAnswer[],
  priority: LeadPriorityResult
): StrategyRouterResult {
  const recommended: StrategyLane[] = [];
  const reasoning: string[] = [];

  const termsResponse = answerFor(qualification, "termsResponse");
  const condition = [answerFor(qualification, "condition"), answerFor(qualification, "repairs")]
    .filter(Boolean).join(" ");
  const legalCoIssue = answerFor(qualification, "legalCoIssues");
  const askingPrice = parseMoneyString(answerFor(qualification, "askingPrice"));
  const mortgageBalance = parseMoneyString(answerFor(qualification, "mortgageBalance"));
  const cashNeeded = parseMoneyString(answerFor(qualification, "cashNeeded"));

  const needsWork = NEEDS_WORK_WORDS.test(condition);
  const goodCondition = GOOD_CONDITION_WORDS.test(condition) && !needsWork;

  const hasFinancials = askingPrice !== undefined || mortgageBalance !== undefined;
  const needsMoreInfo = !hasFinancials || termsResponse === undefined || termsResponse === "UNKNOWN";

  if (legalCoIssue) {
    reasoning.push(`Legal/CO issue mentioned ("${legalCoIssue}") -- verify before proceeding with any strategy.`);
  }

  if (termsResponse === "CASH_ONLY") {
    reasoning.push("Seller wants cash only -- creative financing is off the table. Evaluating as a cash purchase.");
    recommended.push("CASH_BRRRR");
    if (goodCondition) recommended.push("TRADITIONAL_PURCHASE");
    if (needsWork) recommended.push("WHOLESALE", "WHOLETAIL");
  } else if (termsResponse === "OPEN_TO_TERMS" || termsResponse === "MAYBE_NEEDS_EXPLANATION") {
    reasoning.push("Seller responded" + (termsResponse === "OPEN_TO_TERMS" ? "" : " tentatively") + " to terms -- this triggers the verification gate before anything proceeds.");

    if (mortgageBalance !== undefined && askingPrice !== undefined) {
      const equity = askingPrice - mortgageBalance;
      const equityPct = askingPrice > 0 ? equity / askingPrice : 0;
      if (equityPct >= 0.4) {
        recommended.push("SELLER_FINANCE");
        reasoning.push(`Seller appears to have meaningful equity (asking price well above mortgage balance) -- Seller Finance may fit.`);
      } else if (equityPct <= 0.15) {
        recommended.push("SUBJECT_TO");
        reasoning.push(`Mortgage balance is close to the asking price -- Subject-To may fit, pending loan/due-on-sale/title/insurance review.`);
      } else {
        recommended.push("HYBRID");
        reasoning.push(`A mix of existing debt and seller-carried equity -- Hybrid may fit, pending the same verification.`);
      }
    } else {
      reasoning.push("Not enough financial information yet to say which terms structure fits -- get the mortgage balance and asking price first.");
    }

    if (goodCondition) {
      recommended.push("LEASE_OPTION");
      reasoning.push("Property sounds move-in ready -- Lease Option is also worth evaluating as a terms-based alternative.");
    }

    recommended.push("CASH_BRRRR");
    reasoning.push("Always worth running the cash/BRRRR numbers too, even when terms are on the table.");
  } else {
    reasoning.push("Seller hasn't responded to the terms question yet -- ask it before routing a terms-based strategy.");
    recommended.push("CASH_BRRRR");
  }

  if (needsWork) {
    if (!recommended.includes("WHOLESALE")) recommended.push("WHOLESALE");
    if (!recommended.includes("WHOLETAIL")) recommended.push("WHOLETAIL");
    reasoning.push("Property sounds like it needs work -- Wholesale/Wholetail may also fit depending on your bandwidth for this deal.");
  }

  if (priority.level === "UNCLEAR" && termsResponse === "CASH_ONLY") {
    recommended.push("FOLLOW_UP");
    recommended.push("PASS");
    reasoning.push("Motivation is unclear and the seller wants cash only -- if the cash numbers don't work, Follow-Up or Pass are legitimate outcomes. Don't force a structure to avoid losing this lead.");
  } else if (priority.level === "UNCLEAR") {
    recommended.push("FOLLOW_UP");
    reasoning.push("Motivation is unclear right now -- a follow-up conversation may be more useful than an offer today.");
  }

  if (cashNeeded !== undefined && askingPrice !== undefined && cashNeeded >= askingPrice * 0.9) {
    reasoning.push(`Seller says they need close to the full price in cash ($${Math.round(cashNeeded).toLocaleString()} of $${Math.round(askingPrice).toLocaleString()}) -- terms-based strategies are unlikely to work here regardless of what they said about terms.`);
    recommended.push("TRADITIONAL_PURCHASE");
  }

  // De-duplicate while preserving first-seen order.
  const seen = new Set<StrategyLane>();
  const dedup = recommended.filter((lane) => (seen.has(lane) ? false : (seen.add(lane), true)));

  return { recommended: dedup, reasoning, needsMoreInfo };
}
