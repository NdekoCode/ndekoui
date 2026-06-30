import { addDays } from 'date-fns';

import type {
  CalendarEvent,
  EventColor,
  EventColorOption,
} from '@/registry/ndeko/components/event-calendar/_parts';
import {
  allDayEvent,
  everyFewWeeks,
  firstWeekdayOfMonths,
  timedEvent,
} from '@/registry/ndeko/components/event-calendar/_parts/sample-events';

export type CalendarSource = {
  color: EventColor;
  name: string;
};

/** Each calendar owns one colour, so the colour picked in the dialog files the event. */
export const CALENDARS: CalendarSource[] = [
  { color: 'info', name: 'Work' },
  { color: 'primary', name: 'Team rituals' },
  { color: 'success', name: 'Personal' },
  { color: 'warning', name: 'Deadlines' },
  { color: 'destructive', name: 'Out of office' },
];

export const CALENDAR_OPTIONS: EventColorOption[] = CALENDARS.map(
  (calendar) => ({ value: calendar.color, label: calendar.name })
);

const THURSDAY = 4;
const TUESDAY = 2;
const SPRINT_WEEKS = 2;
const STANDUP_DAYS = [-1, 0, 1, 2];

function workEvents(on: (offset: number) => Date): CalendarEvent[] {
  return [
    timedEvent('roadmap', {
      title: 'Roadmap review',
      day: on(0),
      from: 11,
      to: 12.5,
      color: 'info',
      location: 'Room 4A',
      description: 'Priorities for the next two quarters',
    }),
    timedEvent('hiring-sync', {
      title: 'Hiring sync',
      day: on(-1),
      from: 14,
      to: 15,
      color: 'info',
      location: 'Video call',
    }),
    timedEvent('customer-call', {
      title: 'Customer call',
      day: on(2),
      from: 15,
      to: 15.75,
      color: 'info',
      location: 'Video call',
    }),
    timedEvent('weekly-planning', {
      title: 'Weekly planning',
      day: on(6),
      from: 10,
      to: 11,
      color: 'info',
      location: 'Room 2B',
    }),
    timedEvent('partner-workshop', {
      title: 'Partner workshop',
      day: on(9),
      from: 10,
      to: 15.5,
      color: 'info',
      location: 'Marketing floor',
    }),
    allDayEvent('board', {
      title: 'Board meeting',
      first: on(17),
      last: on(17),
      color: 'info',
      location: 'Grand conference centre',
    }),
    timedEvent('user-interviews', {
      title: 'User interviews',
      day: on(21),
      from: 11,
      to: 12,
      color: 'info',
      location: 'Research room',
    }),
    allDayEvent('quarterly-planning', {
      title: 'Quarterly planning',
      first: on(-2),
      last: on(-2),
      color: 'info',
      location: 'Main hall',
    }),
  ];
}

function teamEvents(on: (offset: number) => Date): CalendarEvent[] {
  const standups = STANDUP_DAYS.map((offset) =>
    timedEvent(`standup-${offset}`, {
      title: 'Team standup',
      day: on(offset),
      from: 9.5,
      to: 9.75,
      color: 'primary',
      location: 'Room 2B',
    })
  );
  return [
    ...standups,
    timedEvent('critique', {
      title: 'Design critique',
      day: on(1),
      from: 10,
      to: 11.5,
      color: 'primary',
      location: 'Studio',
      description: 'Onboarding screens, second round',
    }),
    timedEvent('retro', {
      title: 'Sprint retro',
      day: on(-6),
      from: 10,
      to: 11,
      color: 'primary',
      location: 'Room 2B',
    }),
    allDayEvent('launch-week', {
      title: 'Launch week',
      first: on(3),
      last: on(5),
      color: 'primary',
      description: 'The new release goes live',
    }),
  ];
}

function personalEvents(on: (offset: number) => Date): CalendarEvent[] {
  return [
    timedEvent('climbing-0', {
      title: 'Climbing gym',
      day: on(0),
      from: 18,
      to: 19,
      color: 'success',
    }),
    timedEvent('climbing-1', {
      title: 'Climbing gym',
      day: on(-3),
      from: 18,
      to: 19,
      color: 'success',
    }),
    timedEvent('lunch', {
      title: 'Lunch with Mila',
      day: on(1),
      from: 12.5,
      to: 13.5,
      color: 'success',
      location: 'Harbour cafe',
    }),
    timedEvent('dentist', {
      title: 'Dentist',
      day: on(3),
      from: 8,
      to: 8.75,
      color: 'success',
    }),
    timedEvent('friends-dinner', {
      title: 'Dinner with friends',
      day: on(7),
      from: 19.5,
      to: 22,
      color: 'success',
      location: 'Old mill',
    }),
    timedEvent('piano', {
      title: 'Piano lesson',
      day: on(10),
      from: 18,
      to: 19,
      color: 'success',
    }),
  ];
}

function deadlineEvents(on: (offset: number) => Date): CalendarEvent[] {
  return [
    timedEvent('budget-sign-off', {
      title: 'Budget sign-off',
      day: on(-1),
      from: 16,
      to: 16.5,
      color: 'warning',
    }),
    allDayEvent('quarter-report', {
      title: 'Quarter report due',
      first: on(-9),
      last: on(-9),
      color: 'warning',
    }),
    allDayEvent('expenses', {
      title: 'Expense reports due',
      first: on(4),
      last: on(4),
      color: 'warning',
    }),
    allDayEvent('freeze', {
      title: 'Release freeze',
      first: on(8),
      last: on(8),
      color: 'warning',
    }),
    allDayEvent('renewals', {
      title: 'Contract renewals due',
      first: on(12),
      last: on(12),
      color: 'warning',
    }),
  ];
}

function awayEvents(on: (offset: number) => Date): CalendarEvent[] {
  return [
    timedEvent('summit', {
      title: 'Customer summit',
      day: on(4),
      endDay: on(5),
      from: 14.5,
      to: 14.75,
      color: 'destructive',
      location: 'Riverside centre',
    }),
    allDayEvent('offsite', {
      title: 'Team offsite',
      first: on(15),
      last: on(16),
      color: 'destructive',
      location: 'Lakeside lodge',
    }),
    allDayEvent('day-off', {
      title: 'Day off',
      first: on(26),
      last: on(26),
      color: 'destructive',
    }),
    allDayEvent('conference', {
      title: 'Conference trip',
      first: on(-45),
      last: on(-43),
      color: 'destructive',
    }),
    allDayEvent('leave', {
      title: 'Annual leave',
      first: on(-200),
      last: on(-191),
      color: 'destructive',
    }),
  ];
}

function recurringEvents(today: Date): CalendarEvent[] {
  const reviewDays = everyFewWeeks(today, THURSDAY, SPRINT_WEEKS, -22, 4);
  const reviews = reviewDays.map((day, index) =>
    timedEvent(`sprint-review-${index}`, {
      title: 'Sprint review',
      day,
      from: 15,
      to: 16,
      color: 'primary',
      location: 'Room 4A',
    })
  );
  const allHandsDays = firstWeekdayOfMonths(today, TUESDAY, -11, 2);
  const allHands = allHandsDays.map((day, index) =>
    timedEvent(`all-hands-${index}`, {
      title: 'Company all-hands',
      day,
      from: 16,
      to: 17,
      color: 'info',
      location: 'Main hall',
    })
  );
  return [...reviews, ...allHands];
}

/** Fictional events around today, filed in the five calendars of the sidebar. */
export function buildCalendarEvents(): CalendarEvent[] {
  const today = new Date();

  function on(offset: number) {
    return addDays(today, offset);
  }

  return [
    ...workEvents(on),
    ...teamEvents(on),
    ...personalEvents(on),
    ...deadlineEvents(on),
    ...awayEvents(on),
    ...recurringEvents(today),
  ];
}
