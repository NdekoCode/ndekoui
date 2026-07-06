import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameYear,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from 'date-fns';

import { monthIndexOf, readTypedDate } from './typed-date';

export type Period = {
  from: Date;
  to: Date;
};

export type PeriodPreset = {
  phrase: string;
  label: string;
};

const COUNTED_PERIOD = /^(?:last|past) (\d+) (days?|weeks?|months?)$/;
const QUARTER_PERIOD = /^q([1-4])(?: (\d{4}))?$/;
const SINCE_PERIOD = /^since (.+)$/;

const MONDAY = 1;

export const PERIOD_PRESETS: PeriodPreset[] = [
  { phrase: 'last 7 days', label: 'Last 7 days' },
  { phrase: 'last 30 days', label: 'Last 30 days' },
  { phrase: 'this month', label: 'This month' },
  { phrase: 'last month', label: 'Last month' },
  { phrase: 'this quarter', label: 'This quarter' },
  { phrase: 'year to date', label: 'Year to date' },
];

function normalized(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function lastDaysOf(today: Date, days: number): Period {
  return { from: addDays(today, -(days - 1)), to: today };
}

function countedPeriodOf(match: RegExpMatchArray, today: Date): Period | null {
  const amount = Number(match[1]);
  if (amount < 1) {
    return null;
  }
  const unit = match[2][0];
  if (unit === 'w') {
    return lastDaysOf(today, amount * 7);
  }
  if (unit === 'm') {
    const from = addDays(addMonths(today, -amount), 1);
    return { from, to: today };
  }
  return lastDaysOf(today, amount);
}

function earlierDateOf(first: Date, second: Date) {
  if (isBefore(first, second)) {
    return first;
  }
  return second;
}

function quarterPeriodOf(match: RegExpMatchArray, today: Date): Period | null {
  const quarter = Number(match[1]);
  const year = Number(match[2] ?? today.getFullYear());
  const from = new Date(year, (quarter - 1) * 3, 1);
  if (isAfter(from, today)) {
    return null;
  }
  const to = earlierDateOf(endOfQuarter(from), today);
  return { from, to };
}

function sincePeriodOf(match: RegExpMatchArray, today: Date): Period | null {
  const reading = readTypedDate(match[1], {
    today,
    withTime: false,
    direction: 'past',
  });
  if (reading.status !== 'ready') {
    return null;
  }
  const from = reading.value.date;
  if (isAfter(from, today)) {
    return null;
  }
  return { from, to: today };
}

/** A month named on its own is its latest one: "sep" in November is this September, "dec" is last December. */
function monthPeriodOf(text: string, today: Date): Period | null {
  const month = monthIndexOf(text);
  if (month === -1) {
    return null;
  }
  const isLater = month > today.getMonth();
  let year = today.getFullYear();
  if (isLater) {
    year -= 1;
  }
  const from = new Date(year, month, 1);
  return { from, to: earlierDateOf(endOfMonth(from), today) };
}

function namedPeriodOf(text: string, today: Date): Period | null {
  const weekStart = startOfWeek(today, { weekStartsOn: MONDAY });
  const lastMonth = addMonths(today, -1);
  const lastQuarterStart = addMonths(startOfQuarter(today), -3);
  const lastYear = addYears(today, -1);
  if (text === 'today') {
    return { from: today, to: today };
  }
  if (text === 'yesterday') {
    const yesterday = addDays(today, -1);
    return { from: yesterday, to: yesterday };
  }
  if (text === 'this week') {
    return { from: weekStart, to: today };
  }
  if (text === 'last week') {
    const from = addDays(weekStart, -7);
    return { from, to: addDays(from, 6) };
  }
  if (text === 'this month') {
    return { from: startOfMonth(today), to: today };
  }
  if (text === 'last month') {
    return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
  }
  if (text === 'this quarter') {
    return { from: startOfQuarter(today), to: today };
  }
  if (text === 'last quarter') {
    return { from: lastQuarterStart, to: endOfQuarter(lastQuarterStart) };
  }
  if (text === 'this year' || text === 'year to date' || text === 'ytd') {
    return { from: startOfYear(today), to: today };
  }
  if (text === 'last year') {
    return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
  }
  return null;
}

export function readPeriod(text: string, today: Date): Period | null {
  const clean = normalized(text);
  if (clean === '') {
    return null;
  }
  const named = namedPeriodOf(clean, today);
  if (named) {
    return named;
  }
  const counted = clean.match(COUNTED_PERIOD);
  if (counted) {
    return countedPeriodOf(counted, today);
  }
  const quarter = clean.match(QUARTER_PERIOD);
  if (quarter) {
    return quarterPeriodOf(quarter, today);
  }
  const since = clean.match(SINCE_PERIOD);
  if (since) {
    return sincePeriodOf(since, today);
  }
  return monthPeriodOf(clean, today);
}

export function previousPeriodOf(period: Period): Period {
  const length = differenceInCalendarDays(period.to, period.from) + 1;
  const to = addDays(period.from, -1);
  const from = addDays(to, -(length - 1));
  return { from, to };
}

function dayTextOf(date: Date, hasYear: boolean) {
  if (hasYear) {
    return format(date, 'MMM d, y');
  }
  return format(date, 'MMM d');
}

export function periodTextOf(period: Period, today: Date) {
  const isFromThisYear = isSameYear(period.from, today);
  const isToThisYear = isSameYear(period.to, today);
  const hasYear = !isFromThisYear || !isToThisYear;
  const from = dayTextOf(period.from, hasYear);
  if (isSameDay(period.from, period.to)) {
    return from;
  }
  const to = dayTextOf(period.to, hasYear);
  return `${from} to ${to}`;
}
