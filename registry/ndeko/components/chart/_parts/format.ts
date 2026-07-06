const LOCALE = 'en-US';

export const COUNT_FORMAT: Intl.NumberFormatOptions = {
  maximumFractionDigits: 0,
};

export const SIGNED_FORMAT: Intl.NumberFormatOptions = {
  maximumFractionDigits: 0,
  signDisplay: 'exceptZero',
};

export const USD_COMPACT_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
};

const COMPACT_FORMAT: Intl.NumberFormatOptions = {
  notation: 'compact',
  maximumFractionDigits: 1,
};

const COUNT = new Intl.NumberFormat(LOCALE, COUNT_FORMAT);

const SIGNED = new Intl.NumberFormat(LOCALE, SIGNED_FORMAT);

const COMPACT = new Intl.NumberFormat(LOCALE, COMPACT_FORMAT);

const USD_COMPACT = new Intl.NumberFormat(LOCALE, USD_COMPACT_FORMAT);

const DAY = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const MS_PER_DAY = 86_400_000;

export function formatCount(value: number) {
  return COUNT.format(value);
}

export function formatSigned(value: number) {
  return SIGNED.format(value);
}

export function formatCompact(value: number) {
  return COMPACT.format(value);
}

export function formatUsd(value: number) {
  return USD_COMPACT.format(value);
}

export function formatShare(share: number) {
  const percent = Math.round(share * 100);
  return `${percent}%`;
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

export function nounOf(count: number, singular: string, plural: string) {
  if (count === 1) {
    return singular;
  }
  return plural;
}

/**
 * One label per day, or per `everyDays` days for a weekly series. Days are counted in UTC so the
 * server and the browser write the same label.
 */
export function dayLabelsOf(firstDay: string, count: number, everyDays = 1) {
  const start = Date.parse(`${firstDay}T00:00:00Z`);
  const stride = everyDays * MS_PER_DAY;
  return Array.from({ length: count }, (_, index) => {
    const elapsed = index * stride;
    return DAY.format(start + elapsed);
  });
}
