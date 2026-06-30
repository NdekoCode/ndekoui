import {
  addHours,
  areIntervalsOverlapping,
  differenceInMinutes,
  eachDayOfInterval,
  format,
  getHours,
  getMinutes,
  isAfter,
  isSameDay,
  isToday,
  startOfDay,
} from 'date-fns';

import {
  DefaultEventColor,
  DefaultStartHour,
  StartHour,
  WeekCellsHeight,
} from './constants';
import { dayKeyOf } from './navigation';
import type { CalendarEvent, EventColor } from './types';

const LAST_START_HOUR = 23;

/** A clock time as `9am` or `9:30am`, short enough for a month cell. */
export function clockLabelOf(date: Date) {
  let pattern = 'h:mma';
  if (getMinutes(date) === 0) {
    pattern = 'ha';
  }
  return format(date, pattern).toLowerCase();
}

export function timeRangeLabelOf(start: Date, end: Date) {
  const startLabel = clockLabelOf(start);
  const endLabel = clockLabelOf(end);
  return `${startLabel} – ${endLabel}`;
}

/** When the event runs on this day: its hours, its start, its end, or the whole day. */
export function timeLabelOnDay(event: CalendarEvent, day: Date) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const startsThatDay = isSameDay(day, start);
  const endsThatDay = isSameDay(day, end);
  const isWithinDay = startsThatDay && endsThatDay;

  if (event.allDay) {
    return 'All day';
  }
  if (isWithinDay) {
    return timeRangeLabelOf(start, end);
  }
  if (startsThatDay) {
    return `From ${clockLabelOf(start)}`;
  }
  if (endsThatDay) {
    return `Until ${clockLabelOf(end)}`;
  }
  return 'All day';
}

export function ariaCurrentDateOf(isCurrentDay: boolean) {
  if (isCurrentDay) {
    return 'date' as const;
  }
  return undefined;
}

export function eventCountLabelOf(count: number) {
  if (count === 0) {
    return 'No events';
  }
  if (count === 1) {
    return '1 event';
  }
  return `${count} events`;
}

/** How many events touch each day, keyed by `yyyy-MM-dd`. */
export function eventDayCountsOf(events: CalendarEvent[]) {
  const counts = new Map<string, number>();
  for (const event of events) {
    const firstDay = startOfDay(new Date(event.start));
    const lastDay = startOfDay(new Date(event.end));
    if (isAfter(firstDay, lastDay)) {
      continue;
    }
    const days = eachDayOfInterval({ start: firstDay, end: lastDay });
    for (const day of days) {
      const key = dayKeyOf(day);
      const current = counts.get(key) ?? 0;
      counts.set(key, current + 1);
    }
  }
  return counts;
}

function nextFullHourOf(time: Date) {
  const nextHour = getHours(time) + 1;
  return Math.min(nextHour, LAST_START_HOUR);
}

/** Where a new event starts on a day: the next full hour today, the morning on any other day. */
export function defaultStartOf(day: Date) {
  const start = startOfDay(day);
  let hour = DefaultStartHour;
  if (isToday(day)) {
    hour = nextFullHourOf(new Date());
  }
  start.setHours(hour);
  return start;
}

export function snapToQuarterHour(time: Date) {
  const snapped = new Date(time);
  const minutes = snapped.getMinutes();
  const remainder = minutes % 15;
  if (remainder === 0) {
    return snapped;
  }
  const isCloserToPrevious = remainder < 7.5;
  if (isCloserToPrevious) {
    snapped.setMinutes(minutes - remainder, 0, 0);
    return snapped;
  }
  snapped.setMinutes(minutes + 15 - remainder, 0, 0);
  return snapped;
}

export type PositionedEvent = {
  event: CalendarEvent;
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
};

/** The `--chip` colour of an event block, always a theme token. */
export function eventChipStyle(color?: EventColor) {
  const token = color ?? DefaultEventColor;
  return { '--chip': `var(--${token})` } as React.CSSProperties;
}

export function getBorderRadiusClasses(
  isFirstDay: boolean,
  isLastDay: boolean
) {
  const isSingleDay = isFirstDay && isLastDay;
  if (isSingleDay) {
    return 'rounded-sm';
  }
  if (isFirstDay) {
    return 'rounded-s-sm rounded-e-none';
  }
  if (isLastDay) {
    return 'rounded-e-sm rounded-s-none';
  }
  return 'rounded-none';
}

export function isMultiDayEvent(event: CalendarEvent) {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  const isSpanningDays = !isSameDay(eventStart, eventEnd);
  return Boolean(event.allDay) || isSpanningDays;
}

/** Whether the event starts, ends or runs through this day. */
export function occursOnDay(event: CalendarEvent, day: Date) {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  const startsThatDay = isSameDay(day, eventStart);
  const endsThatDay = isSameDay(day, eventEnd);
  const runsThroughDay = day > eventStart && day < eventEnd;
  return startsThatDay || endsThatDay || runsThroughDay;
}

function byStart(a: CalendarEvent, b: CalendarEvent) {
  return new Date(a.start).getTime() - new Date(b.start).getTime();
}

export function getEventsForDay(events: CalendarEvent[], day: Date) {
  const startingThatDay = events.filter((event) =>
    isSameDay(day, new Date(event.start))
  );
  return startingThatDay.sort(byStart);
}

/** Multi-day events first, then by start time. */
export function sortEvents(events: CalendarEvent[]) {
  return [...events].sort((a, b) => {
    const aIsMultiDay = isMultiDayEvent(a);
    const bIsMultiDay = isMultiDayEvent(b);
    if (aIsMultiDay === bIsMultiDay) {
      return byStart(a, b);
    }
    if (aIsMultiDay) {
      return -1;
    }
    return 1;
  });
}

/** Multi-day events that cover this day without starting on it. */
export function getSpanningEventsForDay(events: CalendarEvent[], day: Date) {
  return events.filter((event) => {
    if (!isMultiDayEvent(event)) {
      return false;
    }
    const startsThatDay = isSameDay(day, new Date(event.start));
    if (startsThatDay) {
      return false;
    }
    return occursOnDay(event, day);
  });
}

export function getAllEventsForDay(events: CalendarEvent[], day: Date) {
  return events.filter((event) => occursOnDay(event, day));
}

export function getAgendaEventsForDay(events: CalendarEvent[], day: Date) {
  return getAllEventsForDay(events, day).sort(byStart);
}

function byStartThenLongest(a: CalendarEvent, b: CalendarEvent) {
  const startDifference = byStart(a, b);
  if (startDifference !== 0) {
    return startDifference;
  }
  const aDuration = differenceInMinutes(new Date(a.end), new Date(a.start));
  const bDuration = differenceInMinutes(new Date(b.end), new Date(b.start));
  return bDuration - aDuration;
}

function hourOf(date: Date) {
  return getHours(date) + getMinutes(date) / 60;
}

type PlacedInterval = { start: Date; end: Date };

function firstFreeColumn(
  columns: PlacedInterval[][],
  interval: PlacedInterval
) {
  let columnIndex = 0;
  while (columnIndex < columns.length) {
    const column = columns[columnIndex];
    const overlaps = column.some((placed) =>
      areIntervalsOverlapping(interval, placed)
    );
    if (!overlaps) {
      return columnIndex;
    }
    columnIndex++;
  }
  return columnIndex;
}

function widthOfColumn(columnIndex: number) {
  if (columnIndex === 0) {
    return 1;
  }
  return 0.9;
}

/**
 * Places the timed events of one day on the hour grid. Overlapping events move to the next
 * column, indented by 10% and drawn above the previous one.
 */
export function positionTimedEvents(events: CalendarEvent[], day: Date) {
  const dayStart = startOfDay(day);
  const dayEnd = addHours(dayStart, 24);
  const columns: PlacedInterval[][] = [];
  const sortedEvents = [...events].sort(byStartThenLongest);

  return sortedEvents.map((event): PositionedEvent => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    let visibleStart = dayStart;
    if (isSameDay(day, eventStart)) {
      visibleStart = eventStart;
    }
    let visibleEnd = dayEnd;
    if (isSameDay(day, eventEnd)) {
      visibleEnd = eventEnd;
    }
    const startHour = hourOf(visibleStart);
    const endHour = hourOf(visibleEnd);
    const columnIndex = firstFreeColumn(columns, {
      start: visibleStart,
      end: visibleEnd,
    });
    if (!columns[columnIndex]) {
      columns[columnIndex] = [];
    }
    columns[columnIndex].push({ start: eventStart, end: eventEnd });

    return {
      event,
      top: (startHour - StartHour) * WeekCellsHeight,
      height: (endHour - startHour) * WeekCellsHeight,
      left: columnIndex * 0.1,
      width: widthOfColumn(columnIndex),
      zIndex: 10 + columnIndex,
    };
  });
}
