import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  getDay,
  setHours,
  setMinutes,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import { WeekStartsOn } from './constants';
import type { CalendarEvent, EventColor } from './types';

const THURSDAY = 4;
const TUESDAY = 2;
const SPRINT_WEEKS = 2;

type EventDetails = {
  title: string;
  color: EventColor;
  location?: string;
  description?: string;
};

export type TimedSpec = EventDetails & {
  day: Date;
  /** Hours as a number: 9.5 is 9:30. */
  from: number;
  to: number;
  /** For an event that ends on a later day. */
  endDay?: Date;
};

export type AllDaySpec = EventDetails & {
  first: Date;
  last: Date;
};

/** A time on a day, from hours written as a number: 14.75 is 2:45 pm. */
export function hourOn(day: Date, hour: number) {
  const wholeHours = Math.floor(hour);
  const minutes = Math.round((hour - wholeHours) * 60);
  const dayStart = startOfDay(day);
  const withHours = setHours(dayStart, wholeHours);
  return setMinutes(withHours, minutes);
}

export function timedEvent(id: string, spec: TimedSpec): CalendarEvent {
  const endDay = spec.endDay ?? spec.day;
  return {
    id,
    title: spec.title,
    description: spec.description,
    location: spec.location,
    color: spec.color,
    start: hourOn(spec.day, spec.from),
    end: hourOn(endDay, spec.to),
  };
}

export function allDayEvent(id: string, spec: AllDaySpec): CalendarEvent {
  return {
    id,
    title: spec.title,
    description: spec.description,
    location: spec.location,
    color: spec.color,
    start: startOfDay(spec.first),
    end: endOfDay(spec.last),
    allDay: true,
  };
}

/** The same weekday every few weeks, from `firstStep` to `lastStep` steps around today's week. */
export function everyFewWeeks(
  today: Date,
  weekday: number,
  weeksApart: number,
  firstStep: number,
  lastStep: number
) {
  const weekStart = startOfWeek(today, { weekStartsOn: WeekStartsOn });
  const anchor = addDays(weekStart, weekday - WeekStartsOn);
  const days: Date[] = [];
  for (let step = firstStep; step <= lastStep; step++) {
    days.push(addWeeks(anchor, step * weeksApart));
  }
  return days;
}

/** The first given weekday of each month, from `firstMonth` to `lastMonth` months around today. */
export function firstWeekdayOfMonths(
  today: Date,
  weekday: number,
  firstMonth: number,
  lastMonth: number
) {
  const days: Date[] = [];
  for (let step = firstMonth; step <= lastMonth; step++) {
    const monthStart = startOfMonth(addMonths(today, step));
    const offset = (weekday - getDay(monthStart) + 7) % 7;
    days.push(addDays(monthStart, offset));
  }
  return days;
}

function upcomingEvents(today: Date): CalendarEvent[] {
  function on(offset: number) {
    return addDays(today, offset);
  }

  return [
    timedEvent('standup-0', {
      title: 'Team standup',
      day: today,
      from: 9.5,
      to: 9.75,
      color: 'primary',
      location: 'Room 2B',
    }),
    timedEvent('roadmap', {
      title: 'Roadmap review',
      day: today,
      from: 11,
      to: 12.5,
      color: 'info',
      location: 'Room 4A',
      description: 'Priorities for the next two quarters',
    }),
    timedEvent('interview', {
      title: 'Interview: product designer',
      day: today,
      from: 14,
      to: 15,
      color: 'warning',
      location: 'Video call',
    }),
    timedEvent('one-on-one', {
      title: '1:1 with Tomasz',
      day: today,
      from: 16.5,
      to: 17,
      color: 'success',
      location: 'Corner booth',
    }),
    timedEvent('standup-1', {
      title: 'Team standup',
      day: on(1),
      from: 9.5,
      to: 9.75,
      color: 'primary',
      location: 'Room 2B',
    }),
    timedEvent('critique', {
      title: 'Design critique',
      day: on(1),
      from: 10,
      to: 11.5,
      color: 'warning',
      location: 'Studio',
      description: 'Onboarding screens, second round',
    }),
    timedEvent('client-lunch', {
      title: 'Lunch with a client',
      day: on(1),
      from: 12.5,
      to: 13.75,
      color: 'success',
      location: 'Harbour cafe',
    }),
    timedEvent('customer-call', {
      title: 'Customer call',
      day: on(2),
      from: 15,
      to: 15.75,
      color: 'info',
      location: 'Video call',
    }),
    timedEvent('budget', {
      title: 'Budget review',
      day: on(-1),
      from: 15,
      to: 16,
      color: 'warning',
      location: 'Room 4A',
    }),
    allDayEvent('quarterly-planning', {
      title: 'Quarterly planning',
      first: on(-2),
      last: on(-2),
      color: 'info',
      location: 'Main hall',
    }),
    allDayEvent('launch-week', {
      title: 'Launch week',
      first: on(3),
      last: on(5),
      color: 'primary',
      description: 'The new release goes live',
    }),
    timedEvent('summit', {
      title: 'Customer summit',
      day: on(4),
      endDay: on(5),
      from: 14.5,
      to: 14.75,
      color: 'destructive',
      location: 'Riverside centre',
    }),
    timedEvent('weekly-planning', {
      title: 'Weekly planning',
      day: on(6),
      from: 10,
      to: 11,
      color: 'info',
      location: 'Room 2B',
    }),
    timedEvent('retro', {
      title: 'Sprint retro',
      day: on(-6),
      from: 10,
      to: 11,
      color: 'primary',
      location: 'Room 2B',
    }),
    timedEvent('deadline', {
      title: 'Project deadline',
      day: on(-9),
      from: 13,
      to: 15.5,
      color: 'warning',
      location: 'Office',
      description: 'Final deliverables are due',
    }),
    allDayEvent('freeze', {
      title: 'Release freeze',
      first: on(8),
      last: on(8),
      color: 'destructive',
    }),
    timedEvent('workshop', {
      title: 'Marketing workshop',
      day: on(9),
      from: 10,
      to: 15.5,
      color: 'success',
      location: 'Marketing floor',
    }),
    timedEvent('renewals', {
      title: 'Contract renewals',
      day: on(12),
      from: 13,
      to: 14,
      color: 'warning',
    }),
    allDayEvent('offsite', {
      title: 'Team offsite',
      first: on(15),
      last: on(16),
      color: 'success',
      location: 'Lakeside lodge',
    }),
    allDayEvent('board', {
      title: 'Board meeting',
      first: on(17),
      last: on(17),
      color: 'info',
      location: 'Grand conference centre',
    }),
    timedEvent('interviews', {
      title: 'User interviews',
      day: on(21),
      from: 11,
      to: 12,
      color: 'info',
      location: 'Research room',
    }),
    timedEvent('research-sprint', {
      title: 'Research sprint',
      day: on(26),
      endDay: on(27),
      from: 9,
      to: 17,
      color: 'destructive',
      location: 'Innovation lab',
    }),
    timedEvent('year-end-dinner', {
      title: 'Year-end dinner',
      day: on(38),
      from: 19,
      to: 22,
      color: 'success',
      location: 'Old mill',
    }),
    allDayEvent('annual-planning', {
      title: 'Annual planning',
      first: on(-24),
      last: on(-23),
      color: 'info',
      location: 'Main hall',
    }),
    allDayEvent('security-audit', {
      title: 'Security audit',
      first: on(-45),
      last: on(-43),
      color: 'warning',
    }),
    allDayEvent('hack-week', {
      title: 'Hack week',
      first: on(-200),
      last: on(-196),
      color: 'success',
    }),
  ];
}

function sprintReviews(today: Date) {
  const days = everyFewWeeks(today, THURSDAY, SPRINT_WEEKS, -22, 4);
  return days.map((day, index) =>
    timedEvent(`sprint-review-${index}`, {
      title: 'Sprint review',
      day,
      from: 15,
      to: 16,
      color: 'primary',
      location: 'Room 4A',
    })
  );
}

function allHands(today: Date) {
  const days = firstWeekdayOfMonths(today, TUESDAY, -11, 2);
  return days.map((day, index) =>
    timedEvent(`all-hands-${index}`, {
      title: 'Company all-hands',
      day,
      from: 16,
      to: 17,
      color: 'info',
      location: 'Main hall',
    })
  );
}

/** Fictional events around today, spread so the day, week, month, year and agenda views all have some. */
export function buildSampleEvents(): CalendarEvent[] {
  const today = new Date();
  return [
    ...upcomingEvents(today),
    ...sprintReviews(today),
    ...allHands(today),
  ];
}
