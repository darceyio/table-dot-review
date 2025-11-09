// Static exchange rates for currency conversion
// In production, you might fetch these from an API like exchangerate-api.com
const EXCHANGE_RATES: Record<string, number> = {
  EUR: 1.09,
  GBP: 1.27,
  USD: 1.00,
  CAD: 0.72,
  AUD: 0.65,
  JPY: 0.0067,
};

/**
 * Convert amount from one currency to USD
 * @param amountCents - Amount in cents (smallest currency unit)
 * @param fromCurrency - Source currency code (EUR, GBP, etc.)
 * @returns Amount in USD cents
 */
export function convertToUSD(amountCents: number, fromCurrency: string): number {
  const rate = EXCHANGE_RATES[fromCurrency.toUpperCase()] || 1.0;
  return Math.round(amountCents * rate);
}

/**
 * Format cents as USD currency string
 * @param cents - Amount in cents
 * @returns Formatted string like "$12.50"
 */
export function formatUSD(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Format cents in any currency
 * @param cents - Amount in cents
 * @param currency - Currency code
 * @returns Formatted string
 */
export function formatCurrency(cents: number, currency: string): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}
