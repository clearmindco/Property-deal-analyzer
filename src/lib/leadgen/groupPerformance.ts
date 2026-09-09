import type { GroupPerformance } from "@/lib/types/leadgen";

export interface GroupPerformanceCounts {
  posts: number;
  responses: number;
  leads: number;
  qualifiedLeads: number;
  calls: number;
  offers: number;
  contracts: number;
  closedDeals: number;
}

function rate(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

/**
 * Turns raw counts into conversion rates and a plain-language recommendation. Performance
 * data decides whether to keep using a group -- never group size (spec section: "Do not
 * automatically assume the largest group is best").
 */
export function computeGroupPerformance(counts: GroupPerformanceCounts): GroupPerformance {
  const responsePerPost = rate(counts.responses, counts.posts);
  const leadPerPost = rate(counts.leads, counts.posts);
  const qualifiedLeadRate = rate(counts.qualifiedLeads, counts.leads);
  const offerRate = rate(counts.offers, counts.qualifiedLeads);
  const contractRate = rate(counts.contracts, counts.offers);

  let recommendation: GroupPerformance["recommendation"];
  if (counts.posts < 3) {
    recommendation = "NOT ENOUGH DATA";
  } else if (counts.posts >= 5 && counts.responses === 0) {
    recommendation = "STOP USING";
  } else if (counts.posts >= 5 && counts.responses > 0 && counts.leads === 0) {
    recommendation = "REVIEW APPROACH";
  } else if (leadPerPost >= 0.2 || counts.contracts > 0) {
    recommendation = "KEEP POSTING";
  } else {
    recommendation = "KEEP TESTING";
  }

  return {
    posts: counts.posts,
    responses: counts.responses,
    leads: counts.leads,
    qualifiedLeads: counts.qualifiedLeads,
    calls: counts.calls,
    offers: counts.offers,
    contracts: counts.contracts,
    closedDeals: counts.closedDeals,
    responsePerPost,
    leadPerPost,
    qualifiedLeadRate,
    offerRate,
    contractRate,
    recommendation,
  };
}
