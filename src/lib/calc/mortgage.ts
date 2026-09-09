/** Standard amortizing loan math. All rates are decimals (0.07 = 7%). */

export function monthlyPI(principal: number, annualRatePct: number, termYears: number): number {
  if (principal <= 0) return 0;
  const n = termYears * 12;
  if (n <= 0) return 0;
  const r = annualRatePct / 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

/** Invert the amortization formula: largest principal supportable by a given max monthly payment. */
export function principalFromMonthlyPayment(
  maxMonthlyPayment: number,
  annualRatePct: number,
  termYears: number
): number {
  if (maxMonthlyPayment <= 0) return 0;
  const n = termYears * 12;
  if (n <= 0) return 0;
  const r = annualRatePct / 12;
  if (r === 0) return maxMonthlyPayment * n;
  const factor = Math.pow(1 + r, n);
  return (maxMonthlyPayment * (factor - 1)) / (r * factor);
}
