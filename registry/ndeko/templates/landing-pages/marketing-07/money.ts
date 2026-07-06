const MONEY_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function moneyOf(cents: number) {
  return MONEY_FORMAT.format(cents / 100);
}

export const CENTS_FORMAT = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;
