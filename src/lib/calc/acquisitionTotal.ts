// Wholesaler math (Master Build Prompt section 8): a contract price and an assignment fee are
// two separate numbers a wholesaler quotes. The total acquisition cost before other transaction
// costs (closing costs, holding costs, etc.) is always their sum -- never hidden inside a single
// blended number, and never silently dropped when a fee is present.

export interface AcquisitionTotalBreakdown {
  contractPrice: number;
  assignmentFee: number;
  totalAcquisitionPrice: number;
}

export function resolveTotalAcquisitionPrice(
  contractPrice: number | null | undefined,
  assignmentFee: number | null | undefined
): AcquisitionTotalBreakdown {
  const contract = contractPrice ?? 0;
  const fee = assignmentFee ?? 0;
  return {
    contractPrice: contract,
    assignmentFee: fee,
    totalAcquisitionPrice: contract + fee,
  };
}
