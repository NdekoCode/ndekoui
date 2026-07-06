import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  isAfter,
  isBefore,
  isSameYear,
  startOfDay,
} from 'date-fns';

export type TypedDate = {
  date: Date;
  hasTime: boolean;
};

export type TypedDateOptions = {
  today: Date;
  withTime: boolean;
  /** Which of day and month comes first in numbers such as 14/11. */
  isDayFirst?: boolean;
  /** Where a date with no year lands: the next time it comes round, or the last time it did. */
  direction?: 'future' | 'past';
};

export type TypedDateReading =
  | { status: 'empty' }
  | { status: 'unreadable' }
  | { status: 'ready'; value: TypedDate };

type Clock = {
  hours: number;
  minutes: number;
};

type Parts = {
  year: number;
  month: number;
  day: number;
};

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const WEEKDAY_LEADS = ['', 'this', 'next', 'on'];

const MERIDIEM_TIME = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/;
const CLOCK_TIME = /\b(?:at\s+)?(\d{1,2}):(\d{2})\b/;
const NOON = /\b(?:at\s+)?noon\b/;
const ISO_DATE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const NUMERIC_DATE = /^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{4}|\d{2}))?$/;
const RELATIVE_DATE = /^in (\d+) (days?|d|weeks?|w|months?|years?|y)$/;
const ORDINAL_SUFFIX = /^(\d{1,2})(?:st|nd|rd|th)$/;

function normalized(text: string) {
  const lower = text.toLowerCase().replace(/,/g, ' ');
  const spaced = lower.replace(/(\d)t(\d)/g, '$1 $2');
  return spaced.replace(/\s+/g, ' ').trim();
}

function withoutMatch(text: string, match: RegExpMatchArray) {
  const before = text.slice(0, match.index);
  const after = text.slice((match.index ?? 0) + match[0].length);
  return `${before} ${after}`.replace(/\s+/g, ' ').trim();
}

function meridiemClockOf(match: RegExpMatchArray): Clock | null {
  const hour = Number(match[1]);
  const minutes = Number(match[2] ?? '0');
  const isHourValid = hour >= 1 && hour <= 12;
  const isMinuteValid = minutes <= 59;
  if (!isHourValid || !isMinuteValid) {
    return null;
  }
  const isPm = match[3] === 'pm';
  const hoursOfDay = hour % 12;
  if (isPm) {
    return { hours: hoursOfDay + 12, minutes };
  }
  return { hours: hoursOfDay, minutes };
}

function clockOf(match: RegExpMatchArray): Clock | null {
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const isValid = hours <= 23 && minutes <= 59;
  if (!isValid) {
    return null;
  }
  return { hours, minutes };
}

type TimeSplit = {
  rest: string;
  clock: Clock | null;
  isBroken: boolean;
};

function splitTime(text: string): TimeSplit {
  const meridiem = text.match(MERIDIEM_TIME);
  if (meridiem) {
    const clock = meridiemClockOf(meridiem);
    return {
      rest: withoutMatch(text, meridiem),
      clock,
      isBroken: clock === null,
    };
  }
  const clockMatch = text.match(CLOCK_TIME);
  if (clockMatch) {
    const clock = clockOf(clockMatch);
    return {
      rest: withoutMatch(text, clockMatch),
      clock,
      isBroken: clock === null,
    };
  }
  const noon = text.match(NOON);
  if (noon) {
    return {
      rest: withoutMatch(text, noon),
      clock: { hours: 12, minutes: 0 },
      isBroken: false,
    };
  }
  return { rest: text, clock: null, isBroken: false };
}

function isRealDate({ year, month, day }: Parts) {
  const date = new Date(year, month, day);
  const isSameYearNumber = date.getFullYear() === year;
  const isSameMonth = date.getMonth() === month;
  const isSameDay = date.getDate() === day;
  return isSameYearNumber && isSameMonth && isSameDay;
}

function dateOfParts(parts: Parts) {
  if (!isRealDate(parts)) {
    return null;
  }
  return new Date(parts.year, parts.month, parts.day);
}

/** With no year, "14 nov" typed in December means next year, unless the field looks back in time. */
function withNearestYear(
  parts: Parts,
  today: Date,
  direction: 'future' | 'past'
) {
  const thisYear = dateOfParts(parts);
  if (thisYear === null) {
    return null;
  }
  if (direction === 'past') {
    if (!isAfter(thisYear, today)) {
      return thisYear;
    }
    return dateOfParts({ ...parts, year: parts.year - 1 });
  }
  if (!isBefore(thisYear, today)) {
    return thisYear;
  }
  return dateOfParts({ ...parts, year: parts.year + 1 });
}

export function monthIndexOf(word: string) {
  if (word.length < 3) {
    return -1;
  }
  return MONTHS.findIndex((name) => name.startsWith(word));
}

function weekdayIndexOf(word: string) {
  if (word.length < 3) {
    return -1;
  }
  return WEEKDAYS.findIndex((name) => name.startsWith(word));
}

function dayNumberOf(word: string) {
  const ordinal = word.match(ORDINAL_SUFFIX);
  if (ordinal) {
    return Number(ordinal[1]);
  }
  if (/^\d{1,2}$/.test(word)) {
    return Number(word);
  }
  return null;
}

function weekdayDateOf(today: Date, weekday: number, isNext: boolean) {
  const gap = (weekday - today.getDay() + 7) % 7;
  const mustBeLater = isNext && gap === 0;
  if (mustBeLater) {
    return addDays(today, 7);
  }
  return addDays(today, gap);
}

function relativeDateOf(match: RegExpMatchArray, today: Date) {
  const amount = Number(match[1]);
  const unit = match[2][0];
  if (unit === 'w') {
    return addWeeks(today, amount);
  }
  if (unit === 'm') {
    return addMonths(today, amount);
  }
  if (unit === 'y') {
    return addYears(today, amount);
  }
  return addDays(today, amount);
}

function keywordDateOf(text: string, today: Date) {
  if (text === '' || text === 'today') {
    return today;
  }
  if (text === 'tomorrow' || text === 'tmrw') {
    return addDays(today, 1);
  }
  if (text === 'yesterday') {
    return addDays(today, -1);
  }
  if (text === 'next week') {
    return addWeeks(today, 1);
  }
  if (text === 'next month') {
    return addMonths(today, 1);
  }
  return null;
}

function weekdayPhraseDateOf(text: string, today: Date) {
  const words = text.split(' ');
  const word = words[words.length - 1];
  const lead = words.slice(0, -1).join(' ');
  const hasKnownLead = WEEKDAY_LEADS.includes(lead);
  const weekday = weekdayIndexOf(word);
  if (!hasKnownLead || weekday === -1) {
    return null;
  }
  return weekdayDateOf(today, weekday, lead === 'next');
}

type DayAndMonth = {
  day: number;
  month: number;
};

/** A month that cannot be one (14/11 read month first) is taken the other way round. */
function dayAndMonthOf(
  first: number,
  second: number,
  isDayFirst: boolean
): DayAndMonth {
  const ordered = { day: second, month: first };
  if (isDayFirst) {
    ordered.day = first;
    ordered.month = second;
  }
  const needsSwap = ordered.month > 12 && ordered.day <= 12;
  if (needsSwap) {
    return { day: ordered.month, month: ordered.day };
  }
  return ordered;
}

function numericDateOf(match: RegExpMatchArray, options: TypedDateOptions) {
  const first = Number(match[1]);
  const second = Number(match[2]);
  const rawYear = match[3];
  const isDayFirst = options.isDayFirst ?? false;
  const { day, month } = dayAndMonthOf(first, second, isDayFirst);
  return datePartsDateOf(day, month - 1, rawYear, options);
}

function datePartsDateOf(
  day: number,
  month: number,
  rawYear: string | undefined,
  options: TypedDateOptions
) {
  const { today, direction = 'future' } = options;
  if (rawYear === undefined) {
    const parts = { year: today.getFullYear(), month, day };
    return withNearestYear(parts, today, direction);
  }
  const year = fullYearOf(rawYear);
  return dateOfParts({ year, month, day });
}

function fullYearOf(rawYear: string) {
  const year = Number(rawYear);
  if (rawYear.length === 2) {
    return 2000 + year;
  }
  return year;
}

function monthNameDateOf(text: string, options: TypedDateOptions) {
  const words = text.split(' ').filter((word) => word !== 'of');
  const isShort = words.length === 2 || words.length === 3;
  if (!isShort) {
    return null;
  }
  const [first, second, third] = words;
  const dayFirst = dayNumberOf(first);
  const monthSecond = monthIndexOf(second);
  if (dayFirst !== null && monthSecond !== -1) {
    return datePartsDateOf(dayFirst, monthSecond, third, options);
  }
  const monthFirst = monthIndexOf(first);
  const daySecond = dayNumberOf(second);
  if (monthFirst !== -1 && daySecond !== null) {
    return datePartsDateOf(daySecond, monthFirst, third, options);
  }
  return null;
}

function dateOfText(text: string, options: TypedDateOptions) {
  const { today } = options;
  const keyword = keywordDateOf(text, today);
  if (keyword) {
    return keyword;
  }
  const weekday = weekdayPhraseDateOf(text, today);
  if (weekday) {
    return weekday;
  }
  const relative = text.match(RELATIVE_DATE);
  if (relative) {
    return relativeDateOf(relative, today);
  }
  const iso = text.match(ISO_DATE);
  if (iso) {
    return dateOfParts({
      year: Number(iso[1]),
      month: Number(iso[2]) - 1,
      day: Number(iso[3]),
    });
  }
  const numeric = text.match(NUMERIC_DATE);
  if (numeric) {
    return numericDateOf(numeric, options);
  }
  return monthNameDateOf(text, options);
}

export function readTypedDate(
  text: string,
  options: TypedDateOptions
): TypedDateReading {
  const clean = normalized(text);
  if (clean === '') {
    return { status: 'empty' };
  }
  const { rest, clock, isBroken } = splitTime(clean);
  if (isBroken) {
    return { status: 'unreadable' };
  }
  const isTimeAllowed = options.withTime || clock === null;
  if (!isTimeAllowed) {
    return { status: 'unreadable' };
  }
  const day = dateOfText(rest, options);
  if (day === null) {
    return { status: 'unreadable' };
  }
  const start = startOfDay(day);
  if (clock === null) {
    return { status: 'ready', value: { date: start, hasTime: false } };
  }
  const withClock = new Date(start);
  withClock.setHours(clock.hours, clock.minutes, 0, 0);
  return { status: 'ready', value: { date: withClock, hasTime: true } };
}

function dayPatternOf(hasThisYear: boolean) {
  if (hasThisYear) {
    return 'EEEE d MMMM';
  }
  return 'EEEE d MMMM y';
}

export function describeTypedDate(value: TypedDate, today: Date) {
  const hasThisYear = isSameYear(value.date, today);
  const dayPattern = dayPatternOf(hasThisYear);
  const day = format(value.date, dayPattern);
  if (!value.hasTime) {
    return day;
  }
  const time = format(value.date, 'HH:mm');
  return `${day}, ${time}`;
}

export function formatTypedDate(value: TypedDate) {
  const day = format(value.date, 'd MMM y');
  if (!value.hasTime) {
    return day;
  }
  const time = format(value.date, 'HH:mm');
  return `${day}, ${time}`;
}

export function isDayFirstIn(locale: string) {
  const sample = new Date(2026, 10, 13);
  const parts = new Intl.DateTimeFormat(locale).formatToParts(sample);
  const order = parts.map((part) => part.type);
  return order.indexOf('day') < order.indexOf('month');
}
