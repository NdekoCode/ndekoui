'use client';

import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { useState } from 'react';

import {
  describeTypedDate,
  formatTypedDate,
  isDayFirstIn,
  readTypedDate,
  type TypedDate,
  type TypedDateReading,
} from './typed-date';

export type DayLimits = {
  min?: Date;
  max?: Date;
  /** Days of the week that cannot be picked, 0 for Sunday. */
  disabledWeekdays?: readonly number[];
};

export type TypedDatePreview = {
  text: string;
  /** The text typed so far reads as nothing yet, so this is the last date it did read as. */
  isStale: boolean;
};

type UseTypedDateOptions = DayLimits & {
  /** Null until the page is live, since the day is only known in the browser. */
  today: Date | null;
  withTime: boolean;
  initialText?: string;
};

export const UNREADABLE_MESSAGE = 'Can’t read that. Try “next fri” or “14 nov”';

const EMPTY_READING: TypedDateReading = { status: 'empty' };

export function blockedReasonOf(date: Date, limits: DayLimits) {
  const day = startOfDay(date);
  const { min, max, disabledWeekdays } = limits;
  if (min && isBefore(day, startOfDay(min))) {
    return `Pick a day from ${format(min, 'd MMM')}`;
  }
  if (max && isAfter(day, startOfDay(max))) {
    return `Pick a day up to ${format(max, 'd MMM')}`;
  }
  if (disabledWeekdays?.includes(day.getDay())) {
    return `${format(day, 'EEEE')}s are not available`;
  }
  return null;
}

function localeIsDayFirst() {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return isDayFirstIn(navigator.language);
}

function isSameTypedDate(first: TypedDate | null, second: TypedDate) {
  if (first === null) {
    return false;
  }
  const isSameTime = first.date.getTime() === second.date.getTime();
  return isSameTime && first.hasTime === second.hasTime;
}

function withTimeOf(date: Date, source: TypedDate | null): TypedDate {
  if (source?.hasTime) {
    const merged = startOfDay(date);
    merged.setHours(source.date.getHours(), source.date.getMinutes(), 0, 0);
    return { date: merged, hasTime: true };
  }
  return { date: startOfDay(date), hasTime: false };
}

function errorOf(
  blockedReason: string | null,
  isTouched: boolean,
  reading: TypedDateReading
) {
  if (blockedReason !== null) {
    return blockedReason;
  }
  const isUnreadable = reading.status === 'unreadable';
  if (isTouched && isUnreadable) {
    return UNREADABLE_MESSAGE;
  }
  return null;
}

export function useTypedDate({
  today,
  withTime,
  initialText = '',
  min,
  max,
  disabledWeekdays,
}: UseTypedDateOptions) {
  const [text, setText] = useState(initialText);
  const [value, setValue] = useState<TypedDate | null>(null);
  const [lastReady, setLastReady] = useState<TypedDate | null>(null);
  const [touchedText, setTouchedText] = useState<string | null>(null);
  const [isDayFirst] = useState(localeIsDayFirst);
  const limits: DayLimits = { min, max, disabledWeekdays };
  let reading = EMPTY_READING;
  if (today !== null) {
    reading = readTypedDate(text, { today, withTime, isDayFirst });
  }

  if (
    reading.status === 'ready' &&
    !isSameTypedDate(lastReady, reading.value)
  ) {
    setLastReady(reading.value);
  }
  if (reading.status === 'empty' && lastReady !== null) {
    setLastReady(null);
  }

  let blockedReason: string | null = null;
  if (reading.status === 'ready') {
    blockedReason = blockedReasonOf(reading.value.date, limits);
  }
  const isTouched = touchedText === text;
  const error = errorOf(blockedReason, isTouched, reading);

  let preview: TypedDatePreview | null = null;
  if (today !== null && reading.status === 'ready') {
    preview = { text: describeTypedDate(reading.value, today), isStale: false };
  }
  if (today !== null && reading.status === 'unreadable' && lastReady !== null) {
    preview = { text: describeTypedDate(lastReady, today), isStale: true };
  }

  function commit() {
    if (reading.status === 'empty') {
      setValue(null);
      return null;
    }
    if (reading.status === 'unreadable' || blockedReason !== null) {
      setTouchedText(text);
      return null;
    }
    setValue(reading.value);
    setText(formatTypedDate(reading.value));
    return reading.value;
  }

  function pickDay(date: Date) {
    const next = withTimeOf(date, value ?? lastReady);
    const reason = blockedReasonOf(next.date, limits);
    setText(formatTypedDate(next));
    if (reason !== null) {
      return null;
    }
    setValue(next);
    return next;
  }

  function reset(nextText: string) {
    setText(nextText);
    setValue(null);
    setLastReady(null);
    setTouchedText(null);
  }

  return {
    text,
    changeText: setText,
    value,
    preview,
    error,
    commit,
    pickDay,
    reset,
  };
}

export type TypedDatePicker = ReturnType<typeof useTypedDate>;
