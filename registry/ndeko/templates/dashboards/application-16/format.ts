export const COUNT_FORMAT: Intl.NumberFormatOptions = {
  maximumFractionDigits: 0,
};

export const MONEY_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
};

export const PRECISE_MONEY_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

export const COMPACT_FORMAT: Intl.NumberFormatOptions = {
  notation: 'compact',
  maximumFractionDigits: 1,
};

const COUNT = new Intl.NumberFormat('en-US', COUNT_FORMAT);

export function formatCount(value: number) {
  return COUNT.format(value);
}

export function percentOf(share: number) {
  return Math.round(share * 100);
}

/** A start at zero has no percentage to grow from: it reads as no change. */
export function percentChangeOf(current: number, previous: number) {
  if (previous === 0) {
    return 0;
  }
  const difference = current - previous;
  const ratio = difference / Math.abs(previous);
  return Math.round(ratio * 100);
}

export function changeWordsOf(percent: number, reference: string) {
  if (percent === 0) {
    return `level with ${reference}`;
  }
  const size = Math.abs(percent);
  if (percent > 0) {
    return `up ${size}% on ${reference}`;
  }
  return `down ${size}% on ${reference}`;
}
