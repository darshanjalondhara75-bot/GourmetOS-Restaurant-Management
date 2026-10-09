export const USD_TO_INR_RATE = 83.0;

export function usdToInr(usdAmount: number, rate: number = USD_TO_INR_RATE): number {
  return Math.round(Number(usdAmount || 0) * rate * 100) / 100;
}

export function formatUSD(amount: number): string {
  return `$${Number(amount || 0).toFixed(2)}`;
}

export function formatINR(amount: number): string {
  return `₹${Number(amount || 0).toFixed(2)}`;
}
