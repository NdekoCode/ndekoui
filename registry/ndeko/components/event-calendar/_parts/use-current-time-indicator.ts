'use client';

import { endOfWeek, isSameDay, isWithinInterval, startOfWeek } from 'date-fns';
import { useSyncExternalStore } from 'react';

import { EndHour, StartHour } from './constants';

const MINUTE_MS = 60_000;

function subscribeToMinutes(onMinute: () => void) {
  const timer = window.setInterval(onMinute, MINUTE_MS);
  return () => window.clearInterval(timer);
}

function currentMinute() {
  const now = Date.now();
  return Math.floor(now / MINUTE_MS) * MINUTE_MS;
}

function noMinuteOnServer() {
  return null;
}

function isNowInView(now: Date, currentDate: Date, view: 'day' | 'week') {
  if (view === 'day') {
    return isSameDay(now, currentDate);
  }
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  return isWithinInterval(now, { start: weekStart, end: weekEnd });
}

/** Where the current time sits on the hour grid, as a percentage, refreshed every minute. */
export function useCurrentTimeIndicator(
  currentDate: Date,
  view: 'day' | 'week'
) {
  const minute = useSyncExternalStore(
    subscribeToMinutes,
    currentMinute,
    noMinuteOnServer
  );

  if (minute === null) {
    return { currentTimePosition: 0, currentTimeVisible: false };
  }

  const now = new Date(minute);
  const minutesSinceStart =
    (now.getHours() - StartHour) * 60 + now.getMinutes();
  const minutesInView = (EndHour - StartHour) * 60;
  const currentTimePosition = (minutesSinceStart / minutesInView) * 100;
  const currentTimeVisible = isNowInView(now, currentDate, view);

  return { currentTimePosition, currentTimeVisible };
}
