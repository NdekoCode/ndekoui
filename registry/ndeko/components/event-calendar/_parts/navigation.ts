import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfWeek,
  format,
  getWeek,
  isSameMonth,
  isSameYear,
  isToday,
  isTomorrow,
  isYesterday,
  startOfWeek,
} from 'date-fns';

import { AgendaDaysToShow, WeekStartsOn } from './constants';
import type { CalendarView } from './types';

export type PeriodTitle = {
  full: string;
  short: string;
};

type PeriodRange = {
  start: Date;
  end: Date;
};

const PERIOD_UNITS: Record<CalendarView, string> = {
  day: 'day',
  week: 'week',
  month: 'month',
  year: 'year',
  agenda: `${AgendaDaysToShow} days`,
};

/** A local calendar day as `yyyy-MM-dd`, stable across time zones. */
export function dayKeyOf(day: Date) {
  return format(day, 'yyyy-MM-dd');
}

export function shiftDate(date: Date, view: CalendarView, step: number) {
  if (view === 'year') {
    return addYears(date, step);
  }
  if (view === 'month') {
    return addMonths(date, step);
  }
  if (view === 'week') {
    return addWeeks(date, step);
  }
  if (view === 'day') {
    return addDays(date, step);
  }
  return addDays(date, step * AgendaDaysToShow);
}

export function periodKeyOf(date: Date, view: CalendarView) {
  if (view === 'year') {
    return format(date, 'yyyy');
  }
  if (view === 'month') {
    return format(date, 'yyyy-MM');
  }
  if (view === 'week') {
    const weekStart = startOfWeek(date, { weekStartsOn: WeekStartsOn });
    return dayKeyOf(weekStart);
  }
  return dayKeyOf(date);
}

export function periodUnitOf(view: CalendarView) {
  return PERIOD_UNITS[view];
}

function periodRangeOf(date: Date, view: CalendarView): PeriodRange {
  if (view === 'week') {
    const start = startOfWeek(date, { weekStartsOn: WeekStartsOn });
    const end = endOfWeek(date, { weekStartsOn: WeekStartsOn });
    return { start, end };
  }
  const end = addDays(date, AgendaDaysToShow - 1);
  return { start: date, end };
}

function fullRangeTitleOf({ start, end }: PeriodRange) {
  if (!isSameYear(start, end)) {
    const startLabel = format(start, 'MMM d, yyyy');
    const endLabel = format(end, 'MMM d, yyyy');
    return `${startLabel} – ${endLabel}`;
  }
  if (!isSameMonth(start, end)) {
    const startLabel = format(start, 'MMM d');
    const endLabel = format(end, 'MMM d, yyyy');
    return `${startLabel} – ${endLabel}`;
  }
  const startLabel = format(start, 'MMM d');
  const endLabel = format(end, 'd, yyyy');
  return `${startLabel} – ${endLabel}`;
}

function shortRangeTitleOf({ start, end }: PeriodRange) {
  const startLabel = format(start, 'MMM d');
  if (!isSameMonth(start, end)) {
    const endLabel = format(end, 'MMM d');
    return `${startLabel} – ${endLabel}`;
  }
  const endLabel = format(end, 'd');
  return `${startLabel} – ${endLabel}`;
}

/** The heading of a period, in full and in a short form for narrow headers. */
export function periodTitleOf(date: Date, view: CalendarView): PeriodTitle {
  if (view === 'year') {
    const year = format(date, 'yyyy');
    return { full: year, short: year };
  }
  if (view === 'month') {
    const full = format(date, 'MMMM yyyy');
    const short = format(date, 'MMM yyyy');
    return { full, short };
  }
  if (view === 'day') {
    const full = format(date, 'EEEE, MMMM d, yyyy');
    const short = format(date, 'EEE, MMM d');
    return { full, short };
  }
  const range = periodRangeOf(date, view);
  return { full: fullRangeTitleOf(range), short: shortRangeTitleOf(range) };
}

function relativeDayOf(date: Date) {
  if (isToday(date)) {
    return 'Today';
  }
  if (isTomorrow(date)) {
    return 'Tomorrow';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return null;
}

/** A short hint beside the heading: the week number, or where the day sits from today. */
export function periodCaptionOf(date: Date, view: CalendarView) {
  if (view === 'week') {
    const weekNumber = getWeek(date, { weekStartsOn: WeekStartsOn });
    return `Week ${weekNumber}`;
  }
  if (view === 'day') {
    return relativeDayOf(date);
  }
  return null;
}
