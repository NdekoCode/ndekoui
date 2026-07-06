import {
  DAY_END,
  DAY_START,
  dayIndexOf,
  dayOf,
  DAYS,
  PEOPLE,
  personOf,
  type DayId,
  type PersonId,
} from './data';

export type MeetingRequest = {
  minutes: number;
  /** You are always part of it. */
  attendees: PersonId[];
  days: DayId[];
  /** The part of the day the meeting has to sit in, in minutes since midnight. */
  from: number;
  until: number;
};

export const NO_ATTENDEE_LINE = 'Say who should join: Maya, Jonas or everyone.';

const DEFAULT_MINUTES = 30;

const SHORTEST_MINUTES = 15;

const LONGEST_MINUTES = 240;

const NOON = 12 * 60;

const AFTER_LUNCH = 13 * 60;

const MINUTES = /\b(\d+) ?(?:minutes|minute|mins|min|m)\b/;

const HOURS = /\b(\d+) ?(?:hours|hour|hrs|hr|h)\b/;

const EVERYONE_PHRASES = ['everyone', 'everybody', 'all three', 'the team'];

const PERSON_PHRASES: Record<PersonId, string[]> = {
  you: [],
  maya: ['maya'],
  jonas: ['jonas'],
};

const DAY_PHRASES: Record<DayId, string[]> = {
  mon: ['monday', 'mon', 'today'],
  tue: ['tuesday', 'tue', 'tomorrow'],
  wed: ['wednesday', 'wed'],
  thu: ['thursday', 'thu'],
  fri: ['friday', 'fri'],
};

const LATE_WEEK_PHRASES = [
  'before the weekend',
  'end of the week',
  'late this week',
];

const EARLY_WEEK_PHRASES = ['early this week', 'start of the week'];

const MORNING_PHRASES = ['morning', 'before lunch', 'before noon'];

const AFTERNOON_PHRASES = ['afternoon', 'after lunch'];

const LATE_WEEK: DayId[] = ['thu', 'fri'];

const EARLY_WEEK: DayId[] = ['mon', 'tue'];

const ALL_DAYS = DAYS.map((day) => day.id);

/** Lower case words between single spaces, with a space at both ends so a phrase is matched whole. */
function sentenceOf(text: string) {
  const lowered = text.toLowerCase();
  const spaced = lowered.replace(/[^a-z0-9]+/g, ' ');
  const trimmed = spaced.trim();
  return ` ${trimmed} `;
}

function names(sentence: string, phrases: string[]) {
  return phrases.some((phrase) => sentence.includes(` ${phrase} `));
}

function countIn(sentence: string, unit: RegExp) {
  const match = unit.exec(sentence);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

function boundedMinutes(minutes: number) {
  const atLeastShortest = Math.max(SHORTEST_MINUTES, minutes);
  return Math.min(LONGEST_MINUTES, atLeastShortest);
}

/** The lengths said in words. A longer phrase is read before the shorter one it contains. */
function spelledMinutesOf(sentence: string) {
  if (names(sentence, ['an hour and a half'])) {
    return 90;
  }
  if (names(sentence, ['half an hour'])) {
    return 30;
  }
  if (names(sentence, ['an hour', 'one hour'])) {
    return 60;
  }
  return DEFAULT_MINUTES;
}

/** 45 minutes, 2 hours, 1 hour 30 minutes, or a length said in words. */
function minutesOf(sentence: string) {
  const minutes = countIn(sentence, MINUTES);
  const hours = countIn(sentence, HOURS);
  const hasFigure = minutes !== null || hours !== null;
  if (!hasFigure) {
    return spelledMinutesOf(sentence);
  }
  const fromHours = (hours ?? 0) * 60;
  const fromMinutes = minutes ?? 0;
  return boundedMinutes(fromHours + fromMinutes);
}

function guestsOf(sentence: string) {
  if (names(sentence, EVERYONE_PHRASES)) {
    return PEOPLE.filter((person) => person.id !== 'you');
  }
  return PEOPLE.filter((person) => names(sentence, PERSON_PHRASES[person.id]));
}

function daysOf(sentence: string) {
  if (names(sentence, LATE_WEEK_PHRASES)) {
    return LATE_WEEK;
  }
  if (names(sentence, EARLY_WEEK_PHRASES)) {
    return EARLY_WEEK;
  }
  const named = ALL_DAYS.filter((day) => names(sentence, DAY_PHRASES[day]));
  if (named.length > 0) {
    return named;
  }
  return ALL_DAYS;
}

type DayPart = Pick<MeetingRequest, 'from' | 'until'>;

function dayPartOf(sentence: string): DayPart {
  if (names(sentence, MORNING_PHRASES)) {
    return { from: DAY_START, until: NOON };
  }
  if (names(sentence, AFTERNOON_PHRASES)) {
    return { from: AFTER_LUNCH, until: DAY_END };
  }
  return { from: DAY_START, until: DAY_END };
}

/**
 * Reads a plain request into a meeting to place: how long, with whom, on which days and in which
 * part of the day. A handful of word lists, no model. It returns nothing when nobody is named.
 */
export function requestOfQuestion(text: string): MeetingRequest | null {
  const sentence = sentenceOf(text);
  const guests = guestsOf(sentence);
  if (guests.length === 0) {
    return null;
  }
  const guestIds = guests.map((person) => person.id);
  const dayPart = dayPartOf(sentence);
  return {
    minutes: minutesOf(sentence),
    attendees: ['you', ...guestIds],
    days: daysOf(sentence),
    ...dayPart,
  };
}

/** Maya and Jonas. */
export function guestNamesOf(attendees: PersonId[]) {
  const guests = attendees.filter((id) => id !== 'you');
  const shortNames = guests.map((id) => personOf(id).shortName);
  return shortNames.join(' and ');
}

function areNeighbours(days: DayId[]) {
  const first = dayIndexOf(days[0]);
  return days.every((day, index) => dayIndexOf(day) === first + index);
}

/** Thu, Thu to Fri, Tue and Thu. */
export function daysLabelOf(days: DayId[]) {
  const labels = days.map((day) => dayOf(day).label);
  const isRange = days.length > 1 && areNeighbours(days);
  if (isRange) {
    const last = labels[labels.length - 1];
    return `${labels[0]} to ${last}`;
  }
  return labels.join(' and ');
}

/** 45 min with Maya and Jonas, Thu to Fri. */
export function requestLineOf(request: MeetingRequest) {
  const guests = guestNamesOf(request.attendees);
  const days = daysLabelOf(request.days);
  return `${request.minutes} min with ${guests}, ${days}`;
}
