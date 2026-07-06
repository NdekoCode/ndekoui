import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export type PersonId = 'you' | 'maya' | 'jonas';

export type Person = {
  id: PersonId;
  name: string;
  /** How the person is named in a sentence: You, Maya. */
  shortName: string;
  /** Whose event it is: your, Maya's. */
  possessive: string;
  series: SeriesSlot;
};

export const PEOPLE: Person[] = [
  {
    id: 'you',
    name: 'Lena Brandt',
    shortName: 'You',
    possessive: 'your',
    series: 1,
  },
  {
    id: 'maya',
    name: 'Maya Okafor',
    shortName: 'Maya',
    possessive: "Maya's",
    series: 2,
  },
  {
    id: 'jonas',
    name: 'Jonas Weber',
    shortName: 'Jonas',
    possessive: "Jonas's",
    series: 3,
  },
];

const FALLBACK_PERSON = PEOPLE[0];

export function personOf(id: PersonId) {
  const person = PEOPLE.find((candidate) => candidate.id === id);
  return person ?? FALLBACK_PERSON;
}

export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export type Day = {
  id: DayId;
  label: string;
  name: string;
  date: number;
};

/** One invented working week. Monday is today. */
export const DAYS: Day[] = [
  { id: 'mon', label: 'Mon', name: 'Monday', date: 16 },
  { id: 'tue', label: 'Tue', name: 'Tuesday', date: 17 },
  { id: 'wed', label: 'Wed', name: 'Wednesday', date: 18 },
  { id: 'thu', label: 'Thu', name: 'Thursday', date: 19 },
  { id: 'fri', label: 'Fri', name: 'Friday', date: 20 },
];

export const TODAY: DayId = 'mon';

export const WEEK_LABEL = 'Nov 16 to 20';

const FALLBACK_DAY = DAYS[0];

export function dayOf(id: DayId) {
  const day = DAYS.find((candidate) => candidate.id === id);
  return day ?? FALLBACK_DAY;
}

export function dayIndexOf(id: DayId) {
  return DAYS.findIndex((candidate) => candidate.id === id);
}

const HOUR = 60;

/** The calendar shows the working day, in minutes since midnight. */
export const DAY_START = 9 * HOUR;

export const DAY_END = 18 * HOUR;

export const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

/** 9:00, 13:30: one clock for every time on the block. */
export function clockOf(minutes: number) {
  const hours = Math.floor(minutes / HOUR);
  const rest = minutes % HOUR;
  const paddedRest = String(rest).padStart(2, '0');
  return `${hours}:${paddedRest}`;
}

export function timeRangeOf(start: number, end: number) {
  return `${clockOf(start)} to ${clockOf(end)}`;
}

function at(hours: number, minutes = 0) {
  return hours * HOUR + minutes;
}

export type CalendarEvent = {
  id: string;
  person: PersonId;
  day: DayId;
  start: number;
  end: number;
  title: string;
};

/** Invented meetings of three invented people. */
export const EVENTS: CalendarEvent[] = [
  {
    id: 'you-planning',
    person: 'you',
    day: 'mon',
    start: at(9, 30),
    end: at(10, 30),
    title: 'Weekly planning',
  },
  {
    id: 'you-budget',
    person: 'you',
    day: 'mon',
    start: at(14),
    end: at(15),
    title: 'Budget review',
  },
  {
    id: 'you-customer',
    person: 'you',
    day: 'tue',
    start: at(11),
    end: at(12),
    title: 'Customer call',
  },
  {
    id: 'you-roadmap',
    person: 'you',
    day: 'wed',
    start: at(9),
    end: at(10),
    title: 'Roadmap sync',
  },
  {
    id: 'you-pricing',
    person: 'you',
    day: 'wed',
    start: at(15),
    end: at(16, 30),
    title: 'Pricing workshop',
  },
  {
    id: 'you-hiring',
    person: 'you',
    day: 'thu',
    start: at(9, 30),
    end: at(10, 30),
    title: 'Hiring panel',
  },
  {
    id: 'you-one-to-one',
    person: 'you',
    day: 'thu',
    start: at(13, 30),
    end: at(14, 30),
    title: 'One to one with Priya',
  },
  {
    id: 'you-rehearsal',
    person: 'you',
    day: 'fri',
    start: at(11),
    end: at(12),
    title: 'Demo rehearsal',
  },
  {
    id: 'you-week-review',
    person: 'you',
    day: 'fri',
    start: at(15),
    end: at(16),
    title: 'Week review',
  },
  {
    id: 'maya-design-review',
    person: 'maya',
    day: 'mon',
    start: at(10),
    end: at(11, 30),
    title: 'Design review',
  },
  {
    id: 'maya-crit',
    person: 'maya',
    day: 'tue',
    start: at(9),
    end: at(10),
    title: 'Design crit',
  },
  {
    id: 'maya-interviews',
    person: 'maya',
    day: 'tue',
    start: at(14),
    end: at(16),
    title: 'User interviews',
  },
  {
    id: 'maya-brand',
    person: 'maya',
    day: 'wed',
    start: at(11),
    end: at(12),
    title: 'Brand sync',
  },
  {
    id: 'maya-prototype',
    person: 'maya',
    day: 'thu',
    start: at(14),
    end: at(15, 30),
    title: 'Prototype review',
  },
  {
    id: 'maya-friday-review',
    person: 'maya',
    day: 'fri',
    start: at(9),
    end: at(10),
    title: 'Design review',
  },
  {
    id: 'maya-lunch',
    person: 'maya',
    day: 'fri',
    start: at(13),
    end: at(14),
    title: 'Lunch and learn',
  },
  {
    id: 'jonas-supplier',
    person: 'jonas',
    day: 'mon',
    start: at(13),
    end: at(14),
    title: 'Supplier call',
  },
  {
    id: 'jonas-forecast',
    person: 'jonas',
    day: 'tue',
    start: at(10),
    end: at(11),
    title: 'Sales forecast',
  },
  {
    id: 'jonas-pipeline',
    person: 'jonas',
    day: 'wed',
    start: at(14),
    end: at(15),
    title: 'Pipeline review',
  },
  {
    id: 'jonas-standup',
    person: 'jonas',
    day: 'thu',
    start: at(9),
    end: at(9, 30),
    title: 'Standup',
  },
  {
    id: 'jonas-thursday-supplier',
    person: 'jonas',
    day: 'thu',
    start: at(16),
    end: at(17, 30),
    title: 'Supplier call',
  },
  {
    id: 'jonas-quarter',
    person: 'jonas',
    day: 'fri',
    start: at(14),
    end: at(15),
    title: 'Quarter close',
  },
];

/** Questions a person can send with one press. The first one is the one the demonstration types. */
export const EXAMPLES = [
  '45 minutes with Maya and Jonas before the weekend',
  'An hour with Jonas tomorrow afternoon',
  '30 minutes with everyone on Wednesday morning',
];
