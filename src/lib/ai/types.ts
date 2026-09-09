// AI service layer contract (spec section 42). All financial numbers are computed by
// src/lib/calc (deterministic TypeScript) BEFORE they ever reach an AI provider -- the
// provider only explains, extracts, classifies, or summarizes. It never calculates.

export interface AiDealSummaryOutput {
  whatWeKnow: string[];
  whatLooksGood: string[];
  whatConcernsUs: string[];
  whatIsUnknown: string[];
  whatCouldKillTheDeal: string[];
  whatNeedsVerification: string[];
  priceRecommendation: string;
  financingRecommendation: string;
  exitStrategyRecommendation: string;
  nextSteps: string[];
  generatedBy: "heuristic" | "claude";
  generatedAt: string;
}

export interface StructuredVoiceField {
  field: string;
  value: string | number | boolean;
  confirmed: boolean;
}

export interface AiProvider {
  name: "heuristic" | "claude";
  generateDealSummary(input: DealSummaryContext): Promise<AiDealSummaryOutput>;
  structureVoiceNote(transcript: string): Promise<StructuredVoiceField[]>;
}

// Minimal context the summary generator needs -- deliberately plain data, not Prisma types,
// so it stays independent of the ORM and easy to unit test.
export interface DealSummaryContext {
  address: string;
  askingPrice?: number;
  arv?: number;
  arvConfidence?: string;
  rehabTotal?: number;
  rentMonthly?: number;
  targetOffer?: number;
  idealAcquisition?: number;
  maximumAcquisition?: number;
  cashRemainingAtAsking?: number;
  postRefiCashFlowAtAsking?: number;
  decisionVerdict?: "STRONG_FIT" | "NEEDS_WORK" | "DOESNT_FIT";
  openDealKillers: { label: string; note?: string }[];
  unknownFacts: string[];
  worstStressVerdict?: "SURVIVES" | "TIGHT" | "FAILS";
}
