'use client';

import {
  addDays,
  addMonths,
  endOfWeek,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { useLayoutEffect, useRef, useState } from 'react';

import { WeekStartsOn } from './constants';
import { dayKeyOf } from './navigation';

type RovingDayOptions = {
  /** The day that holds the tab stop until one is picked. */
  defaultDay: Date;
  firstDay: Date;
  lastDay: Date;
};

function movedDayOf(day: Date, key: string) {
  if (key === 'ArrowLeft') {
    return addDays(day, -1);
  }
  if (key === 'ArrowRight') {
    return addDays(day, 1);
  }
  if (key === 'ArrowUp') {
    return addDays(day, -7);
  }
  if (key === 'ArrowDown') {
    return addDays(day, 7);
  }
  if (key === 'Home') {
    return startOfWeek(day, { weekStartsOn: WeekStartsOn });
  }
  if (key === 'End') {
    const weekEnd = endOfWeek(day, { weekStartsOn: WeekStartsOn });
    return startOfDay(weekEnd);
  }
  if (key === 'PageUp') {
    return addMonths(day, -1);
  }
  if (key === 'PageDown') {
    return addMonths(day, 1);
  }
  return null;
}

function clampedDayOf(day: Date, firstDay: Date, lastDay: Date) {
  if (isBefore(day, firstDay)) {
    return firstDay;
  }
  if (isAfter(day, lastDay)) {
    return lastDay;
  }
  return day;
}

function isWithinRange(day: Date, firstDay: Date, lastDay: Date) {
  const isBeforeRange = isBefore(day, firstDay);
  const isAfterRange = isAfter(day, lastDay);
  return !isBeforeRange && !isAfterRange;
}

function activeDayOf(
  storedDay: Date | null,
  { defaultDay, firstDay, lastDay }: RovingDayOptions
) {
  if (!storedDay) {
    return clampedDayOf(defaultDay, firstDay, lastDay);
  }
  if (!isWithinRange(storedDay, firstDay, lastDay)) {
    return clampedDayOf(defaultDay, firstDay, lastDay);
  }
  return storedDay;
}

function isDayButton(target: EventTarget) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.dataset.day !== undefined;
}

/**
 * One tab stop for a grid of days: the arrow keys move by day and week, Home and End go to
 * the ends of the week, Page Up and Page Down move by month, and focus follows.
 */
export function useRovingDay(options: RovingDayOptions) {
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocusRef = useRef(false);
  const [storedDay, setStoredDay] = useState<Date | null>(null);
  const activeDay = activeDayOf(storedDay, options);
  const activeKey = dayKeyOf(activeDay);

  useLayoutEffect(() => {
    if (!shouldFocusRef.current) {
      return;
    }
    shouldFocusRef.current = false;
    const selector = `[data-day="${activeKey}"]`;
    const target = gridRef.current?.querySelector<HTMLElement>(selector);
    target?.focus();
  }, [activeKey]);

  function handleKeyDown(keyEvent: React.KeyboardEvent) {
    if (!isDayButton(keyEvent.target)) {
      return;
    }
    const movedDay = movedDayOf(activeDay, keyEvent.key);
    if (!movedDay) {
      return;
    }
    keyEvent.preventDefault();
    const nextDay = clampedDayOf(movedDay, options.firstDay, options.lastDay);
    if (isSameDay(nextDay, activeDay)) {
      return;
    }
    shouldFocusRef.current = true;
    setStoredDay(nextDay);
  }

  function tabIndexOf(day: Date) {
    if (isSameDay(day, activeDay)) {
      return 0;
    }
    return -1;
  }

  return {
    gridRef,
    activeDay,
    handleKeyDown,
    tabIndexOf,
    rememberDay: setStoredDay,
  };
}
