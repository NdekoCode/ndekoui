'use client';

import { useMemo } from 'react';

import { Calendar } from '@/registry/ndeko/ui/calendar';

import { dayKeyOf } from './navigation';
import type { CalendarEvent } from './types';
import { eventDayCountsOf } from './utils';

/** A small dot under the number of a day with events, light on the picked day. */
const BUSY_MARK = [
  '*:before:pointer-events-none *:before:absolute *:before:bottom-1 *:before:start-1/2 *:before:size-[3px] *:before:-translate-x-1/2 *:before:rounded-full *:before:bg-foreground/40',
  '[&[data-selected]>*]:before:bg-primary-foreground/70',
].join(' ');

const COMPACT_CLASS_NAMES = {
  month_caption: 'mx-8 h-8',
  weekday: 'size-8',
  day: 'size-8',
  day_button: 'size-8',
};

type MiniMonthProps = {
  events: CalendarEvent[];
  selected: Date;
  onSelect: (day: Date) => void;
  /** The month on screen, when the parent follows it. */
  month?: Date;
  onMonthChange?: (month: Date) => void;
  className?: string;
};

/** A month to pick a day from, with a dot on the days that hold events. */
export function MiniMonth({
  events,
  selected,
  onSelect,
  month,
  onMonthChange,
  className,
}: MiniMonthProps) {
  const counts = useMemo(() => eventDayCountsOf(events), [events]);

  function isBusy(day: Date) {
    const dayKey = dayKeyOf(day);
    return counts.has(dayKey);
  }

  function pick(day: Date | undefined) {
    if (day) {
      onSelect(day);
    }
  }

  return (
    <Calendar
      mode='single'
      required
      selected={selected}
      onSelect={pick}
      month={month}
      onMonthChange={onMonthChange}
      defaultMonth={selected}
      modifiers={{ busy: isBusy }}
      modifiersClassNames={{ busy: BUSY_MARK }}
      classNames={COMPACT_CLASS_NAMES}
      className={className}
    />
  );
}
