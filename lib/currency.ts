export function formatPrice(price: number, currency: string) {
  const symbol = currency === "KRW" ? "₩" : currency === "MYR" ? "RM" : currency;
  return `${symbol}${price.toLocaleString()}`;
}

export const CURRENCIES = ["MYR", "KRW"] as const;
