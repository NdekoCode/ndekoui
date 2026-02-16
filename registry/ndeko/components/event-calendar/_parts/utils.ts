import {
  addHours,
  areIntervalsOverlapping,
  differenceInMinutes,
  getHours,
  getMinutes,
  isSameDay,
  startOfDay,
} from 'date-fns';

import { DefaultEventColor, StartHour, WeekCellsHeight } from './constants';
import type { CalendarEvent, EventColor } from './types';

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
