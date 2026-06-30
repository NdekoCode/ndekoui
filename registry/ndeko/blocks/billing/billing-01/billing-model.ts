import { CAP_BOUNDS, METERS, type Meter } from './data';

export type MeterTone = 'calm' | 'near' | 'over';

export type SpendCap = { amount: number; isCapped: boolean };

export const MONEY_LOCALE = 'en-IE';

export const MONEY_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

export const WHOLE_MONEY_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
};

const MONEY = new Intl.NumberFormat(MONEY_LOCALE, MONEY_FORMAT);

const WHOLE_MONEY = new Intl.NumberFormat(MONEY_LOCALE, WHOLE_MONEY_FORMAT);

const NEAR_LIMIT_SHARE = 0.8;

export function formatMoney(amount: number) {
  return MONEY.format(amount);
}

export function formatWholeMoney(amount: number) {
  return WHOLE_MONEY.format(amount);
}

export function formatQuantity(value: number, decimals: number) {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return formatter.format(value);
}

export function overageOf(meter: Meter) {
  const extra = meter.used - meter.included;
  return Math.max(extra, 0);
}

export function overageCostOf(meter: Meter) {
  if (meter.overagePrice === null) {
    return 0;
  }
  const extra = overageOf(meter);
  return extra * meter.overagePrice;
}

export function onDemandTotal() {
  let total = 0;
  for (const meter of METERS) {
    total += overageCostOf(meter);
  }
  return total;
}

export function toneOf(meter: Meter): MeterTone {
  const share = meter.used / meter.included;
  if (share > 1) {
    return 'over';
  }
  if (share >= NEAR_LIMIT_SHARE) {
    return 'near';
  }
  return 'calm';
}

/** The share of the bar to fill, never past its end: the overage is told in words beside it. */
export function fillOf(meter: Meter) {
  const share = meter.used / meter.included;
  return Math.min(share, 1);
}

export function shareOfCapRange(amount: number) {
  const span = CAP_BOUNDS.max - CAP_BOUNDS.min;
  const share = (amount - CAP_BOUNDS.min) / span;
  const atMost = Math.min(share, 1);
  return Math.max(atMost, 0);
}

export function capLabelOf(cap: SpendCap) {
  if (!cap.isCapped) {
    return 'No cap';
  }
  return `${formatWholeMoney(cap.amount)} a month`;
}

export function isCapReached(cap: SpendCap, spent: number) {
  if (!cap.isCapped) {
    return false;
  }
  return spent >= cap.amount;
}

export function sameCap(first: SpendCap, second: SpendCap) {
  const sameAmount = first.amount === second.amount;
  const sameSwitch = first.isCapped === second.isCapped;
  return sameAmount && sameSwitch;
}

export function daysLabelOf(days: number) {
  if (days === 1) {
    return '1 day';
  }
  return `${days} days`;
}
