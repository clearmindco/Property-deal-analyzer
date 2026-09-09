export function maxLoanByLtv(value: number, ltvPct: number): number {
  return Math.max(0, value) * ltvPct;
}

export function maxLoanByLtc(totalCost: number, ltcPct: number): number {
  return Math.max(0, totalCost) * ltcPct;
}

export function ltvRatio(loan: number, value: number): number {
  if (value <= 0) return 0;
  return loan / value;
}

export function ltcRatio(loan: number, cost: number): number {
  if (cost <= 0) return 0;
  return loan / cost;
}
