import type { LeadPriorityResult, QualificationAnswer } from "@/lib/types/leadgen";

function answerFor(qualification: QualificationAnswer[], key: string): string | undefined {
  const a = qualification.find((q) => q.key === key);
  const v = a?.value?.trim();
  return v && v.length > 0 ? v : undefined;
}

const URGENCY_WORDS = /asap|30 day|this month|this week|immediately|urgent|soon|quickly/i;
const FINANCIAL_PRESSURE_WORDS = /behind|debt|can'?t afford|struggl|foreclos|owe|arrears|late/i;
const OPEN_WORDS = /yes|open|maybe|consider|possibly|sure/i;
const VACANT_WORDS = /vacant|empty|no one living/i;

/**
 * Every reason here is directly observable from what the seller actually said -- there is
 * no hidden score. STRONG/MODERATE/UNCLEAR is just "how many of these signals fired,"
 * shown alongside the reasons (spec: "Do NOT create an unexplained AI motivation score").
 */
export function computeLeadPriority(qualification: QualificationAnswer[]): LeadPriorityResult {
  const reasons: string[] = [];

  const timeline = answerFor(qualification, "timeline");
  const occupancy = answerFor(qualification, "occupancy");
  const sellerReason = answerFor(qualification, "sellerReason");
  const liensDebts = answerFor(qualification, "liensDebts");
  const openToTerms = answerFor(qualification, "openToTerms");
  const mortgageBalance = answerFor(qualification, "mortgageBalance");
  const monthlyPayment = answerFor(qualification, "monthlyPayment");

  const isVacant = occupancy ? VACANT_WORDS.test(occupancy) : false;
  const hasMortgageInfo = Boolean(mortgageBalance || monthlyPayment);

  if (timeline && URGENCY_WORDS.test(timeline)) {
    reasons.push(`Wants to sell soon: "${timeline}"`);
  }

  if (isVacant) {
    reasons.push("Property is currently vacant");
  }

  if (isVacant && hasMortgageInfo) {
    reasons.push("Likely paying carrying costs on an empty property");
  }

  if (
    (sellerReason && FINANCIAL_PRESSURE_WORDS.test(sellerReason)) ||
    (liensDebts && FINANCIAL_PRESSURE_WORDS.test(liensDebts))
  ) {
    reasons.push("Mentioned financial pressure (debt, arrears, or can't afford it)");
  }

  if (sellerReason && !FINANCIAL_PRESSURE_WORDS.test(sellerReason)) {
    reasons.push(`Gave a specific reason for selling: "${sellerReason}"`);
  }

  if (hasMortgageInfo) {
    reasons.push("Provided mortgage information");
  }

  if (openToTerms && OPEN_WORDS.test(openToTerms)) {
    reasons.push("Open to discussing terms");
  }

  const answeredCount = qualification.filter((q) => q.value.trim().length > 0).length;
  if (answeredCount >= 6) {
    reasons.push("Has been responsive and forthcoming with details");
  }

  let level: LeadPriorityResult["level"] = "UNCLEAR";
  if (reasons.length >= 3) level = "STRONG";
  else if (reasons.length >= 1) level = "MODERATE";

  return { level, reasons };
}
