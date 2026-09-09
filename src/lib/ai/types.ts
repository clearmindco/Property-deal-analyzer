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

export interface SellerMessageAnalysis {
  /** New answers this message suggests -- unconfirmed until the user approves them. */
  extractedAnswers: StructuredVoiceField[];
  whatWeKnow: string[];
  whatWeStillNeed: string[];
  nextBestQuestion: string;
  suggestedResponse: string;
}

export interface AiProvider {
  name: "heuristic" | "claude";
  generateDealSummary(input: DealSummaryContext): Promise<AiDealSummaryOutput>;
  structureVoiceNote(transcript: string): Promise<StructuredVoiceField[]>;
  /** Seller response assistant (lead-gen module): reads one seller message against what's
   * already confirmed, and returns what's known/missing plus ONE next question -- never a
   * list of ten questions at once. */
  analyzeSellerMessage(
    message: string,
    existingAnswers: { key: string; label: string; value: string; confirmed: boolean }[]
  ): Promise<SellerMessageAnalysis>;
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
