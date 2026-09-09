export function cashOnCashReturn(annualCashFlow: number, cashInvested: number): number {
  if (cashInvested <= 0) return 0;
  return annualCashFlow / cashInvested;
}
