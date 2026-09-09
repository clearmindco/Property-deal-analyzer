import type { AiDealSummaryOutput, AiProvider, DealSummaryContext, StructuredVoiceField } from "./types";

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
};
