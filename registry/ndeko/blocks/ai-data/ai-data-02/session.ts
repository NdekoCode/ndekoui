import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import {
  guestNamesOf,
  NO_ATTENDEE_LINE,
  requestOfQuestion,
  type MeetingRequest,
} from './ask';
import {
  dayOf,
  EVENTS,
  EXAMPLES,
  PEOPLE,
  timeRangeOf,
  type DayId,
  type PersonId,
} from './data';
import { suggestionsOf, type Busy, type Slot, type Suggestion } from './find';

export type SearchStatus = 'shading' | 'offering' | 'booked';

/** One question and what came of it: first the busy time is shaded, then the times are offered, then one is booked. */
export type Search = {
  request: MeetingRequest;
  suggestions: Suggestion[];
  status: SearchStatus;
};

export type Booking = Slot & {
  /** The demonstration and a person name their bookings apart, so an undo that runs out only ever ends its own. */
  id: string;
  attendees: PersonId[];
  title: string;
};

export type CalendarState = {
  question: string;
  /** Why the last question could not be answered. */
  askHint: string | null;
  /** Whose calendars show. */
  shown: PersonId[];
  /** The day a narrow page shows. */
  day: DayId;
  search: Search | null;
  /** The suggestion under the pointer or the focus. */
  hot: number | null;
  bookings: Booking[];
  /** The booking that can still be undone. */
  undoId: string | null;
  spoken: string;
};

export type CalendarAction =
  | { type: 'questionTyped'; text: string }
  | { type: 'asked' }
  | { type: 'offered' }
  | { type: 'hovered'; rank: number | null }
  | { type: 'booked'; rank: number; id: string }
  | { type: 'undone' }
  | { type: 'undoExpired'; id: string }
  | { type: 'searchCleared' }
  | { type: 'calendarsShown'; shown: PersonId[] }
  | { type: 'dayPicked'; day: DayId };

type Step = SessionStep<CalendarState, CalendarAction>;

export const NO_TIME_LINE =
  'No time fits everyone in that window. Try a shorter meeting or more days.';

const ALL_PEOPLE = PEOPLE.map((person) => person.id);

export const INITIAL: CalendarState = {
  question: '',
  askHint: null,
  shown: ALL_PEOPLE,
  day: 'mon',
  search: null,
  hot: null,
  bookings: [],
  undoId: null,
  spoken: '',
};

function busyOfBooking(booking: Booking): Busy[] {
  return booking.attendees.map((person) => ({
    person,
    day: booking.day,
    start: booking.start,
    end: booking.end,
    title: booking.title,
  }));
}

/** The time every person is taken: their own meetings, and the ones booked here that they attend. */
export function takenOf(bookings: Booking[]): Busy[] {
  const booked = bookings.flatMap(busyOfBooking);
  return [...EVENTS, ...booked];
}

function calendarsWordOf(count: number) {
  if (count === 1) {
    return '1 calendar';
  }
  return `${count} calendars`;
}

function timesWordOf(count: number) {
  if (count === 1) {
    return '1 time found';
  }
  return `${count} times found`;
}

export function slotLineOf(slot: Slot) {
  const day = dayOf(slot.day);
  return `${day.name} ${timeRangeOf(slot.start, slot.end)}`;
}

function unanswered(state: CalendarState, hint: string): CalendarState {
  return { ...state, askHint: hint, spoken: hint };
}

/** A new question settles the last booking: its undo goes, the meeting stays. */
function asked(state: CalendarState): CalendarState {
  const request = requestOfQuestion(state.question);
  if (!request) {
    return unanswered(state, NO_ATTENDEE_LINE);
  }
  const suggestions = suggestionsOf(request, takenOf(state.bookings));
  if (suggestions.length === 0) {
    return unanswered(state, NO_TIME_LINE);
  }
  const shown = ALL_PEOPLE.filter((person) => {
    const isShown = state.shown.includes(person);
    return isShown || request.attendees.includes(person);
  });
  const calendars = calendarsWordOf(request.attendees.length);
  return {
    ...state,
    askHint: null,
    shown,
    day: request.days[0],
    search: { request, suggestions, status: 'shading' },
    hot: null,
    undoId: null,
    spoken: `Checking ${calendars}`,
  };
}

function offered(state: CalendarState): CalendarState {
  const search = state.search;
  if (search?.status !== 'shading') {
    return state;
  }
  const [best] = search.suggestions;
  const times = timesWordOf(search.suggestions.length);
  const spoken = `${times}. Best: ${slotLineOf(best)}. ${best.reason}`;
  return {
    ...state,
    search: { ...search, status: 'offering' },
    day: best.day,
    spoken,
  };
}

function suggestionOf(search: Search, rank: number) {
  return search.suggestions.find((candidate) => candidate.rank === rank);
}

/** A narrow page shows one day: it follows the suggestion a person points at. */
function hovered(state: CalendarState, rank: number | null): CalendarState {
  const search = state.search;
  if (search?.status !== 'offering') {
    return { ...state, hot: null };
  }
  if (rank === null) {
    return { ...state, hot: null };
  }
  const suggestion = suggestionOf(search, rank);
  if (!suggestion) {
    return { ...state, hot: null };
  }
  return { ...state, hot: rank, day: suggestion.day };
}

function booked(state: CalendarState, rank: number, id: string): CalendarState {
  const search = state.search;
  if (search?.status !== 'offering') {
    return state;
  }
  const suggestion = suggestionOf(search, rank);
  if (!suggestion) {
    return state;
  }
  const guests = guestNamesOf(search.request.attendees);
  const booking: Booking = {
    id,
    day: suggestion.day,
    start: suggestion.start,
    end: suggestion.end,
    attendees: search.request.attendees,
    title: `Sync with ${guests}`,
  };
  const spoken = `Booked ${slotLineOf(booking)} with ${guests}. Undo stays for 5 seconds`;
  return {
    ...state,
    question: '',
    askHint: null,
    day: booking.day,
    search: { ...search, status: 'booked' },
    hot: null,
    bookings: [...state.bookings, booking],
    undoId: id,
    spoken,
  };
}

/** The meeting leaves and the times it was picked from are offered again. */
function undone(state: CalendarState): CalendarState {
  const undoId = state.undoId;
  if (undoId === null) {
    return state;
  }
  const bookings = state.bookings.filter((booking) => booking.id !== undoId);
  const next = { ...state, bookings, undoId: null, spoken: 'Booking undone' };
  const search = state.search;
  if (search?.status !== 'booked') {
    return next;
  }
  return { ...next, search: { ...search, status: 'offering' } };
}

function undoExpired(state: CalendarState, id: string): CalendarState {
  if (state.undoId !== id) {
    return state;
  }
  const next = { ...state, undoId: null, spoken: '' };
  if (state.search?.status !== 'booked') {
    return next;
  }
  return { ...next, search: null };
}

function searchCleared(state: CalendarState): CalendarState {
  if (state.search?.status === 'booked') {
    return state;
  }
  return { ...state, search: null, hot: null, spoken: '' };
}

export function reducer(
  state: CalendarState,
  action: CalendarAction
): CalendarState {
  switch (action.type) {
    case 'questionTyped':
      return { ...state, question: action.text, askHint: null };
    case 'asked':
      return asked(state);
    case 'offered':
      return offered(state);
    case 'hovered':
      return hovered(state, action.rank);
    case 'booked':
      return booked(state, action.rank, action.id);
    case 'undone':
      return undone(state);
    case 'undoExpired':
      return undoExpired(state, action.id);
    case 'searchCleared':
      return searchCleared(state);
    case 'calendarsShown':
      return { ...state, shown: action.shown };
    case 'dayPicked':
      return { ...state, day: action.day };
  }
}

/** How long the busy time stays shaded before the times are offered. */
export const THINK_MS = 1200;

export const UNDO_MS = 5000;

const KEY_MS = 40;

const DEMO_BOOKING = 'demo';

const [QUESTION] = EXAMPLES;

function typingSteps(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((typed, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'questionTyped', text: typed },
  }));
}

/** The question is typed and sent, the assistant shades the busy time and offers three times. */
const ASKING: Step[] = [
  ...typingSteps(QUESTION, 1200),
  { after: 500, by: 'demo', press: 'ask', action: { type: 'asked' } },
  { after: THINK_MS, action: { type: 'offered' } },
];

/** The demonstration looks at each time, books the best one and lets the undo run out. */
const BOOKING: Step[] = [
  { after: 1700, by: 'demo', action: { type: 'hovered', rank: 2 } },
  { after: 1000, by: 'demo', action: { type: 'hovered', rank: 3 } },
  { after: 1000, by: 'demo', action: { type: 'hovered', rank: 1 } },
  {
    after: 1300,
    by: 'demo',
    press: 'book-1',
    action: { type: 'booked', rank: 1, id: DEMO_BOOKING },
  },
  { after: UNDO_MS, action: { type: 'undoExpired', id: DEMO_BOOKING } },
];

export const SCRIPT: Step[] = [...ASKING, ...BOOKING];

function endOf(script: Step[]) {
  let state = INITIAL;
  for (const step of script) {
    state = reducer(state, step.action);
  }
  return state;
}

/** Under reduced motion the three times are on the calendar, waiting for a choice. */
export const RESTING: CalendarState = { ...endOf(ASKING), spoken: '' };

export const LOOP_AFTER_MS = 2800;
