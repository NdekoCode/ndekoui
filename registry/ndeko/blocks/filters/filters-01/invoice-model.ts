import {
  AMOUNT_BOUNDS,
  HISTOGRAM_BIN_COUNT,
  type AmountRange,
  type Invoice,
  type StatusFilter,
  WORKSPACE,
} from './data';

export type HistogramBin = {
  id: string;
  count: number;
  /** Share of the tallest bin, from 0 to 1. */
  share: number;
  isInRange: boolean;
};

export const FULL_RANGE: AmountRange = [AMOUNT_BOUNDS.min, AMOUNT_BOUNDS.max];

export const CURRENCY_LOCALE = 'en-IE';

export const CURRENCY_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
};

const CURRENCY = new Intl.NumberFormat(CURRENCY_LOCALE, CURRENCY_FORMAT);

export function formatAmount(amount: number) {
  return CURRENCY.format(amount);
}

export function isFullRange(range: AmountRange) {
  const startsAtMinimum = range[0] === AMOUNT_BOUNDS.min;
  const endsAtMaximum = range[1] === AMOUNT_BOUNDS.max;
  return startsAtMinimum && endsAtMaximum;
}

export function sameRange(first: AmountRange, second: AmountRange) {
  const sameStart = first[0] === second[0];
  const sameEnd = first[1] === second[1];
  return sameStart && sameEnd;
}

export function rangeLabelOf(range: AmountRange) {
  if (range[1] === AMOUNT_BOUNDS.max) {
    return `${formatAmount(range[0])} and over`;
  }
  if (range[0] === AMOUNT_BOUNDS.min) {
    return `Up to ${formatAmount(range[1])}`;
  }
  return `${formatAmount(range[0])} – ${formatAmount(range[1])}`;
}

export function matchesStatus(invoice: Invoice, status: StatusFilter) {
  if (status === 'all') {
    return true;
  }
  return invoice.status === status;
}

export function isInRange(amount: number, range: AmountRange) {
  const isAboveStart = amount >= range[0];
  const isBelowEnd = amount <= range[1];
  return isAboveStart && isBelowEnd;
}

export function invoicesInRange(invoices: Invoice[], range: AmountRange) {
  return invoices.filter((invoice) => isInRange(invoice.amount, range));
}

export function totalOf(invoices: Invoice[]) {
  let total = 0;
  for (const invoice of invoices) {
    total += invoice.amount;
  }
  return total;
}

export function invoiceCountLabel(count: number) {
  if (count === 1) {
    return 'invoice';
  }
  return 'invoices';
}

function binIndexOf(amount: number, binWidth: number) {
  const index = Math.floor((amount - AMOUNT_BOUNDS.min) / binWidth);
  return Math.min(index, HISTOGRAM_BIN_COUNT - 1);
}

function tallestOf(counts: number[]) {
  const tallest = Math.max(...counts);
  return Math.max(tallest, 1);
}

/** A bin lights up when its middle sits inside the range, so a thumb dragged across a bin flips it once. */
export function histogramOf(invoices: Invoice[], range: AmountRange) {
  const span = AMOUNT_BOUNDS.max - AMOUNT_BOUNDS.min;
  const binWidth = span / HISTOGRAM_BIN_COUNT;
  const counts: number[] = Array.from({ length: HISTOGRAM_BIN_COUNT }, () => 0);
  for (const invoice of invoices) {
    const index = binIndexOf(invoice.amount, binWidth);
    counts[index] += 1;
  }
  const tallest = tallestOf(counts);
  const bins: HistogramBin[] = counts.map((count, index) => {
    const middle = AMOUNT_BOUNDS.min + binWidth * (index + 0.5);
    return {
      id: `bin-${index}`,
      count,
      share: count / tallest,
      isInRange: isInRange(middle, range),
    };
  });
  return bins;
}

function statusPhraseOf(status: StatusFilter) {
  if (status === 'all') {
    return 'No invoice';
  }
  return `No ${status} invoice`;
}

function rangePhraseOf(range: AmountRange) {
  const start = formatAmount(range[0]);
  const end = formatAmount(range[1]);
  if (range[1] === AMOUNT_BOUNDS.max) {
    return `of ${start} or more`;
  }
  if (range[0] === AMOUNT_BOUNDS.min) {
    return `up to ${end}`;
  }
  return `between ${start} and ${end}`;
}

export function emptyLineOf(status: StatusFilter, range: AmountRange) {
  const subject = statusPhraseOf(status);
  if (isFullRange(range)) {
    return `${subject} in ${WORKSPACE.period}`;
  }
  const rangePhrase = rangePhraseOf(range);
  return `${subject} ${rangePhrase}`;
}
