import type {
  AiDealSummaryOutput, AiProvider, DealSummaryContext, SellerMessageAnalysis, StructuredVoiceField,
} from "./types";
import { QUALIFICATION_FIELDS, type QualificationAnswer, type QualificationKey } from "@/lib/types/leadgen";
import { nextCoreQuestion } from "@/lib/leadgen/coreQuestions";

const SELLER_MESSAGE_PATTERNS: Array<{ key: QualificationKey; regex: RegExp; parse?: (m: RegExpMatchArray) => string }> = [
  { key: "propertyType", regex: /\b(single[- ]family|duplex|triplex|fourplex|multi[- ]?family|condo|townhouse)\b/i, parse: (m) => m[1]! },
  { key: "occupancy", regex: /\b(vacant|empty|occupied|tenant[s]? living|renters? (?:in|there))\b/i, parse: (m) => m[1]! },
  { key: "currentRent", regex: /rent(?:ing)? for \$?([\d,]+)|rent is \$?([\d,]+)/i, parse: (m) => `$${(m[1] ?? m[2])!.replace(/,/g, "")}` },
  { key: "mortgageBalance", regex: /(?:owe|mortgage balance|balance is)[^.]*?\$?([\d,]+)/i, parse: (m) => `$${m[1]!.replace(/,/g, "")}` },
  { key: "interestRate", regex: /(\d+(?:\.\d+)?)\s*%\s*(?:interest|rate)/i, parse: (m) => `${m[1]}%` },
  { key: "monthlyPayment", regex: /(?:monthly payment|pay(?:ing)?)[^.]*?\$?([\d,]+)\s*(?:\/?\s*month|a month|per month)/i, parse: (m) => `$${m[1]!.replace(/,/g, "")}` },
  { key: "taxes", regex: /tax(?:es)?[^.]*?\$?([\d,]+)/i, parse: (m) => `$${m[1]!.replace(/,/g, "")}` },
  { key: "askingPrice", regex: /(?:asking|want|looking for|hoping for)[^.]*?\$?([\d,]{4,})/i, parse: (m) => `$${m[1]!.replace(/,/g, "")}` },
  { key: "timeline", regex: /\b(asap|this week|this month|30 days?|60 days?|90 days?|next month|no rush|whenever)\b/i, parse: (m) => m[1]! },
  { key: "sellerReason", regex: /\b(relocat\w*|divorc\w*|inherit\w*|behind on payments|can'?t afford|tired of (?:tenants|being a landlord)|moving|downsizing|job)\b/i, parse: (m) => m[1]! },
  { key: "liensDebts", regex: /\b(lien|liens|owe (?:back )?taxes|hoa (?:debt|balance)|second mortgage)\b/i, parse: (m) => m[1]! },
  { key: "openToTerms", regex: /\b(open to (?:terms|payments|financing)|payments over time|owner financ\w*)\b/i, parse: (m) => m[1]! },
  { key: "condition", regex: /\b(good condition|needs work|fixer|rough shape|updated|renovated|move[- ]in ready)\b/i, parse: (m) => m[1]! },
  { key: "cashNeeded", regex: /need(?:s)?[^.]*?\$?([\d,]{3,})[^.]*?(?:cash|closing|out of it)/i, parse: (m) => `$${m[1]!.replace(/,/g, "")}` },
  { key: "repairs", regex: /\b(new roof|roof leak|needs? (?:a )?roof|foundation issue|needs plumbing|needs electrical|needs a furnace|water damage)\b/i, parse: (m) => m[1]! },
  { key: "legalCoIssues", regex: /\b(no certificate of occupancy|no co\b|illegal (?:unit|apartment)|code violation|permit issue)\b/i, parse: (m) => m[1]! },
  { key: "taxStatus", regex: /taxes?\s+(?:are|is)?\s*(current|up to date|delinquent|behind)\b/i, parse: (m) => (/current|up to date/i.test(m[1]!) ? "Current" : "Delinquent") },
  { key: "secondMortgageHeloc", regex: /\b(heloc|second mortgage|home equity line)\b/i, parse: (m) => m[1]! },
  { key: "loanType", regex: /\b(FHA loan|VA loan|USDA loan|conventional loan|conventional mortgage)\b/i, parse: (m) => m[1]! },
  { key: "arrears", regex: /\b(behind on (?:my |the )?(?:payments|mortgage)|in arrears|missed (?:a )?payment)\b/i, parse: (m) => m[1]! },
  { key: "termsResponse", regex: /\b(cash only|need it all (?:now|upfront)|not interested in (?:terms|payments|financing)|open to (?:terms|payments|financing)|willing to (?:consider|do) payments)\b/i, parse: (m) => (/cash only|need it all|not interested/i.test(m[1]!) ? "CASH_ONLY" : "OPEN_TO_TERMS") },
];


/**
 * Zero-dependency provider: deterministic sentence templates built from numbers the
 * calculation engine already produced. This is what the app uses when no external AI
 * key is configured, so the product works out of the box (spec section 42).
 */
export const heuristicProvider: AiProvider = {
  name: "heuristic",

  async generateDealSummary(ctx: DealSummaryContext): Promise<AiDealSummaryOutput> {
    const whatWeKnow: string[] = [`Address: ${ctx.address}.`];
    if (ctx.askingPrice) whatWeKnow.push(`Asking price is $${Math.round(ctx.askingPrice).toLocaleString()}.`);
    if (ctx.arv) whatWeKnow.push(`Estimated ARV is $${Math.round(ctx.arv).toLocaleString()} (${ctx.arvConfidence ?? "unverified"}).`);
    if (ctx.rehabTotal) whatWeKnow.push(`Estimated rehab budget (with contingency) is $${Math.round(ctx.rehabTotal).toLocaleString()}.`);
    if (ctx.rentMonthly) whatWeKnow.push(`Estimated rent is $${Math.round(ctx.rentMonthly).toLocaleString()}/month.`);

    const whatLooksGood: string[] = [];
    const whatConcernsUs: string[] = [];

    if (ctx.postRefiCashFlowAtAsking !== undefined) {
      if (ctx.postRefiCashFlowAtAsking > 0) {
        whatLooksGood.push(`Post-refinance cash flow at the current asking price is positive (about $${Math.round(ctx.postRefiCashFlowAtAsking).toLocaleString()}/month).`);
      } else {
        whatConcernsUs.push(`Post-refinance cash flow at the current asking price is negative (about $${Math.round(ctx.postRefiCashFlowAtAsking).toLocaleString()}/month).`);
      }
    }

    if (ctx.cashRemainingAtAsking !== undefined) {
      if (ctx.cashRemainingAtAsking <= 0) {
        whatLooksGood.push("At the current asking price, refinancing appears to return all invested cash.");
      } else {
        whatConcernsUs.push(`At the current asking price, roughly $${Math.round(ctx.cashRemainingAtAsking).toLocaleString()} would remain invested in the property after refinance.`);
      }
    }

    if (ctx.worstStressVerdict === "FAILS") {
      whatConcernsUs.push("The deal fails under combined stress testing (higher rehab, lower ARV, lower rent, higher rate, longer hold) -- it currently depends on optimistic assumptions.");
    } else if (ctx.worstStressVerdict === "TIGHT") {
      whatConcernsUs.push("The deal gets tight under combined stress testing -- there isn't much room for things to go wrong.");
    } else if (ctx.worstStressVerdict === "SURVIVES") {
      whatLooksGood.push("The deal survives combined stress testing (higher rehab, lower ARV, lower rent, higher rate, longer hold).");
    }

    const whatCouldKillTheDeal = ctx.openDealKillers.map((k) => k.note ? `${k.label} -- ${k.note}` : k.label);
    const whatIsUnknown = [...ctx.unknownFacts];
    const whatNeedsVerification = [...whatCouldKillTheDeal];

    let priceRecommendation = "Add ARV, rehab, and rent estimates to calculate an acquisition price.";
    if (ctx.maximumAcquisition !== undefined) {
      priceRecommendation = `Based on current assumptions, the maximum acquisition price that meets your investment requirements is about $${Math.round(ctx.maximumAcquisition).toLocaleString()}.`;
      if (ctx.idealAcquisition !== undefined && ctx.targetOffer !== undefined) {
        priceRecommendation += ` The ideal acquisition price (where refinancing returns all your cash) is about $${Math.round(ctx.idealAcquisition).toLocaleString()}; a reasonable opening offer is about $${Math.round(ctx.targetOffer).toLocaleString()}.`;
      }
    }

    const financingRecommendation = "Compare this deal against every saved lender on the Lenders page -- the lowest rate is not always the lowest total cost.";
    const exitStrategyRecommendation = "BRRRR is the default underwriting model here. Revisit the Exit Strategy section once ARV, rehab, and rent are verified to see if another exit fits better.";

    const nextSteps: string[] = [];
    if (whatCouldKillTheDeal.length > 0) nextSteps.push(`Verify: ${whatCouldKillTheDeal.slice(0, 3).join("; ")}.`);
    if (ctx.decisionVerdict === "NEEDS_WORK" || ctx.decisionVerdict === "DOESNT_FIT") {
      nextSteps.push("Do not offer at the current asking price without renegotiating or revisiting assumptions.");
    }
    if (nextSteps.length === 0) nextSteps.push("Confirm remaining unknowns, then move toward an offer.");

    return {
      whatWeKnow, whatLooksGood, whatConcernsUs, whatIsUnknown, whatCouldKillTheDeal,
      whatNeedsVerification, priceRecommendation, financingRecommendation, exitStrategyRecommendation,
      nextSteps, generatedBy: "heuristic", generatedAt: new Date().toISOString(),
    };
  },

  async structureVoiceNote(transcript: string): Promise<StructuredVoiceField[]> {
    // Lightweight keyword extraction so voice notes become suggested structured fields
    // (spec section 5) without requiring an external AI key. Real provider can replace this
    // with an LLM-based extractor behind the same interface.
    const fields: StructuredVoiceField[] = [];
    const patterns: Array<{ field: string; regex: RegExp; parse?: (m: RegExpMatchArray) => string | number }> = [
      { field: "roofAgeYears", regex: /roof[^.]*?(\d+)\s*year/i, parse: (m) => Number(m[1]) },
      { field: "furnaceAgeYears", regex: /furnace[^.]*?(\d+)\s*year/i, parse: (m) => Number(m[1]) },
      { field: "waterHeaterAgeYears", regex: /water\s*heater[^.]*?(\d+)\s*year/i, parse: (m) => Number(m[1]) },
      { field: "electricalPanelAgeYears", regex: /(?:electrical|panel)[^.]*?(\d+)\s*year/i, parse: (m) => Number(m[1]) },
      { field: "annualTaxes", regex: /tax(?:es)?[^.]*?\$?([\d,]+)/i, parse: (m) => Number(m[1]!.replace(/,/g, "")) },
      { field: "occupancyAtClosing", regex: /\b(vacant|occupied)\b/i, parse: (m) => m[1]!.toUpperCase() },
    ];

    for (const p of patterns) {
      const match = transcript.match(p.regex);
      if (match) {
        const value = p.parse ? p.parse(match) : match[0];
        fields.push({ field: p.field, value, confirmed: false });
      }
    }
    return fields;
  },

  async analyzeSellerMessage(
    message: string,
    existingAnswers: { key: string; label: string; value: string; confirmed: boolean }[]
  ): Promise<SellerMessageAnalysis> {
    const confirmedKeys = new Set(existingAnswers.filter((a) => a.confirmed && a.value.trim()).map((a) => a.key));

    const extractedAnswers: StructuredVoiceField[] = [];
    for (const p of SELLER_MESSAGE_PATTERNS) {
      if (confirmedKeys.has(p.key)) continue; // already confirmed, don't re-suggest
      const match = message.match(p.regex);
      if (match) {
        const value = p.parse ? p.parse(match) : match[0]!;
        extractedAnswers.push({ field: p.key, value, confirmed: false });
      }
    }
    const suggestedKeys = new Set(extractedAnswers.map((a) => a.field));

    const whatWeKnow = existingAnswers
      .filter((a) => a.confirmed && a.value.trim())
      .map((a) => `${a.label}: ${a.value}`);

    // Treat this message's suggestions as "answered" for picking the next question, so we
    // don't ask about something the seller just told us before it's confirmed.
    const stillMissing = QUALIFICATION_FIELDS.filter(
      (f) => !confirmedKeys.has(f.key) && !suggestedKeys.has(f.key)
    );
    const whatWeStillNeed = stillMissing.map((f) => f.label);

    // "Next best question" is always one of the 10 core questions (spec: "Seller
    // Conversation Engine"), not a granular field prompt -- treat both confirmed answers
    // and this message's fresh suggestions as "answered" so we never ask about something
    // the seller just told us before it's even been confirmed.
    const answeredForNav: QualificationAnswer[] = [
      ...existingAnswers
        .filter((a) => a.confirmed && a.value.trim())
        .map((a): QualificationAnswer => ({ key: a.key as QualificationKey, value: a.value, confirmed: true, source: "manual" })),
      ...extractedAnswers.map((a): QualificationAnswer => ({ key: a.field as QualificationKey, value: String(a.value), confirmed: true, source: "seller_message" })),
    ];
    const next = nextCoreQuestion(answeredForNav);
    const nextBestQuestion = next ? next.question : "Nothing left -- this lead is fully qualified.";

    const ack = extractedAnswers.length > 0 ? "Thanks, that's really helpful. " : "Thanks for getting back to me! ";
    const suggestedResponse = next ? `${ack}${next.question}` : `${ack}I think I have everything I need for now -- let me take a look and follow up shortly.`;

    return { extractedAnswers, whatWeKnow, whatWeStillNeed, nextBestQuestion, suggestedResponse };
  },
};
