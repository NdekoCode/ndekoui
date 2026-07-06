import type { MeetingRequest } from './ask';
import {
  DAY_END,
  DAY_START,
  dayIndexOf,
  personOf,
  type DayId,
  type PersonId,
} from './data';

export type Slot = {
  day: DayId;
  start: number;
  end: number;
};

/** Time one person is taken: a meeting of theirs, or one booked here that they attend. */
export type Busy = Slot & {
  person: PersonId;
  title: string;
};

export type Suggestion = Slot & {
  /** 1 is the best time found. */
  rank: number;
  reason: string;
};

type Candidate = Slot & {
  score: number;
  reason: string;
};

/** Candidate times start on the hour and on the half hour. */
const STEP_MINUTES = 30;

/** Less room than this between two meetings reads as back to back. */
const BREATHING_MINUTES = 15;

const LUNCH_START = 12 * 60;

const LUNCH_END = 13 * 60;

const LATE_AFTER = 17 * 60;

/** Two times offered on one day sit at least this far apart, so the three are real choices. */
const SPREAD_MINUTES = 60;

const SUGGESTION_COUNT = 3;

const BACK_TO_BACK_COST = 40;

const LATE_COST = 30;

const LUNCH_COST = 25;

const BEST_SCORE = 100;

function overlaps(first: Slot, second: Slot) {
  const isSameDay = first.day === second.day;
  const startsBeforeEnd = first.start < second.end;
  const endsAfterStart = first.end > second.start;
  return isSameDay && startsBeforeEnd && endsAfterStart;
}

function isFree(taken: Busy[], slot: Slot) {
  return !taken.some((busy) => overlaps(busy, slot));
}

/** The meeting one of them leaves right before the slot, if any. */
function meetingJustBefore(taken: Busy[], slot: Slot) {
  return taken.find((busy) => {
    const isSameDay = busy.day === slot.day;
    const gap = slot.start - busy.end;
    const endsBefore = gap >= 0;
    const isTooShort = gap < BREATHING_MINUTES;
    return isSameDay && endsBefore && isTooShort;
  });
}

/** The meeting one of them has to reach right after the slot, if any. */
function meetingJustAfter(taken: Busy[], slot: Slot) {
  return taken.find((busy) => {
    const isSameDay = busy.day === slot.day;
    const gap = busy.start - slot.end;
    const startsAfter = gap >= 0;
    const isTooShort = gap < BREATHING_MINUTES;
    return isSameDay && startsAfter && isTooShort;
  });
}

function whoOf(attendees: PersonId[]) {
  if (attendees.length > 2) {
    return 'Everyone';
  }
  return 'Both';
}

function ownedTitleOf(busy: Busy) {
  const owner = personOf(busy.person);
  return `${owner.possessive} ${busy.title}`;
}

/**
 * A slot starts from the best score and pays for what makes it worse. Its reason names the first
 * thing a person would mind, or says there is none.
 */
function candidateOf(taken: Busy[], slot: Slot, who: string): Candidate {
  const before = meetingJustBefore(taken, slot);
  const after = meetingJustAfter(taken, slot);
  const startsBeforeLunchEnds = slot.start < LUNCH_END;
  const endsAfterLunchStarts = slot.end > LUNCH_START;
  const runsIntoLunch = startsBeforeLunchEnds && endsAfterLunchStarts;
  const isLate = slot.end > LATE_AFTER;
  let score = BEST_SCORE;
  let reason = `${who} free, no back-to-back`;
  if (isLate) {
    score -= LATE_COST;
    reason = `${who} free, last thing in the day`;
  }
  if (runsIntoLunch) {
    score -= LUNCH_COST;
    reason = `${who} free, runs into lunch`;
  }
  if (after) {
    score -= BACK_TO_BACK_COST;
    reason = `${who} free, ends as ${ownedTitleOf(after)} starts`;
  }
  if (before) {
    score -= BACK_TO_BACK_COST;
    reason = `${who} free, straight after ${ownedTitleOf(before)}`;
  }
  return { ...slot, score, reason };
}

function candidatesOn(
  day: DayId,
  request: MeetingRequest,
  taken: Busy[],
  who: string
) {
  const candidates: Candidate[] = [];
  const first = Math.max(DAY_START, request.from);
  const dayEnd = Math.min(DAY_END, request.until);
  const lastStart = dayEnd - request.minutes;
  for (let start = first; start <= lastStart; start += STEP_MINUTES) {
    const slot = { day, start, end: start + request.minutes };
    if (isFree(taken, slot)) {
      candidates.push(candidateOf(taken, slot, who));
    }
  }
  return candidates;
}

/** The best score first; between equals the earlier day, then the earlier hour. */
function byPreference(first: Candidate, second: Candidate) {
  if (first.score !== second.score) {
    return second.score - first.score;
  }
  const dayOrder = dayIndexOf(first.day) - dayIndexOf(second.day);
  if (dayOrder !== 0) {
    return dayOrder;
  }
  return first.start - second.start;
}

function isTooClose(candidate: Candidate, chosen: Candidate) {
  const isSameDay = candidate.day === chosen.day;
  const startsBeforeReach = candidate.start < chosen.end + SPREAD_MINUTES;
  const endsAfterReach = candidate.end > chosen.start - SPREAD_MINUTES;
  return isSameDay && startsBeforeReach && endsAfterReach;
}

/**
 * Works out when everyone asked is free for the length asked, and keeps the best three: no model
 * is called. `taken` holds the busy time of every person; only the attendees are looked at.
 */
export function suggestionsOf(
  request: MeetingRequest,
  taken: Busy[]
): Suggestion[] {
  const theirs = taken.filter((busy) =>
    request.attendees.includes(busy.person)
  );
  const who = whoOf(request.attendees);
  const candidates = request.days.flatMap((day) =>
    candidatesOn(day, request, theirs, who)
  );
  candidates.sort(byPreference);
  const chosen: Candidate[] = [];
  for (const candidate of candidates) {
    const isCrowded = chosen.some((kept) => isTooClose(candidate, kept));
    if (isCrowded) {
      continue;
    }
    chosen.push(candidate);
    if (chosen.length === SUGGESTION_COUNT) {
      break;
    }
  }
  return chosen.map((candidate, index) => ({
    day: candidate.day,
    start: candidate.start,
    end: candidate.end,
    rank: index + 1,
    reason: candidate.reason,
  }));
}

/** The busy time of the attendees on one day, as bands that do not overlap: what the calendar shades. */
export function busyBandsOf(
  taken: Busy[],
  attendees: PersonId[],
  day: DayId
): Slot[] {
  const theirs = taken.filter((busy) => {
    const isAttendee = attendees.includes(busy.person);
    return isAttendee && busy.day === day;
  });
  const ordered = [...theirs];
  ordered.sort((first, second) => first.start - second.start);
  const bands: Slot[] = [];
  for (const busy of ordered) {
    const last = bands[bands.length - 1];
    const joinsLast = last !== undefined && busy.start <= last.end;
    if (joinsLast) {
      last.end = Math.max(last.end, busy.end);
      continue;
    }
    bands.push({ day, start: busy.start, end: busy.end });
  }
  return bands;
}
