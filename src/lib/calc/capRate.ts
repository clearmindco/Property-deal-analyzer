export function capRate(annualNoi: number, price: number): number {
  if (price <= 0) return 0;
  return annualNoi / price;
}
