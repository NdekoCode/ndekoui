'use client';

import {
  addDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfYear,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfDay,
  startOfYear,
} from 'date-fns';
import { useMemo } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { WeekStartsOn } from './constants';
import { dayKeyOf } from './navigation';
import type { CalendarEvent } from './types';
import { useRovingDay } from './use-roving-day';
import {
  ariaCurrentDateOf,
  eventCountLabelOf,
  eventDayCountsOf,
} from './utils';

const REFERENCE_SUNDAY = new Date(2023, 0, 1);

const WEEKDAY_INITIALS = Array.from({ length: 7 }, (_, index) => {
  const weekday = addDays(REFERENCE_SUNDAY, index + WeekStartsOn);
  return { key: format(weekday, 'EEE'), initial: format(weekday, 'EEEEE') };
});

const YEAR_DAY = [
  'mx-auto flex aspect-square w-full max-w-8 cursor-pointer items-center justify-center rounded-full text-[11px] tabular-nums text-foreground outline-none @4xl:text-xs',
  'transition-[background-color,scale,box-shadow] duration-150 ease-(--ease-out-strong) active:scale-90',
  'not-data-today:hover:bg-foreground/[0.07] focus-visible:ring-[3px] focus-visible:ring-ring/25',
  'data-today:bg-primary data-today:font-medium data-today:text-primary-foreground',
  'data-selected:ring-[1.5px] data-selected:ring-primary-ink',
].join(' ');

/** Busier days take a deeper tint of the brand: one event, two, three or more. */
const DENSITY_CLASSES = [
  '',
  'bg-primary/[0.09]',
  'bg-primary/[0.18]',
  'bg-primary/[0.3]',
];

const LEGEND = [
  { label: '1 event', className: DENSITY_CLASSES[1] },
  { label: '2 events', className: DENSITY_CLASSES[2] },
  { label: '3 or more', className: DENSITY_CLASSES[3] },
  { label: 'Today', className: 'bg-primary' },
];

function densityClassOf(count: number) {
  const level = Math.min(count, DENSITY_CLASSES.length - 1);
  return DENSITY_CLASSES[level];
}

function dayLabelOf(day: Date, count: number) {
  const date = format(day, 'EEEE, MMMM d');
  if (count === 0) {
    return date;
  }
  return `${date}, ${eventCountLabelOf(count)}`;
}

function leadingBlanksOf(month: Date) {
  const weekday = getDay(month);
  return (weekday - WeekStartsOn + 7) % 7;
}

function isSelectedDay(day: Date, selectedDay: Date | null | undefined) {
  if (!selectedDay) {
    return false;
  }
  return isSameDay(day, selectedDay);
}

function ariaPressedOf(isSelectable: boolean, isSelected: boolean) {
  if (!isSelectable) {
    return undefined;
  }
  return isSelected;
}

function tabIndexOf(day: Date, activeDay: Date) {
  if (isSameDay(day, activeDay)) {
    return 0;
  }
  return -1;
}

type YearDayProps = {
  day: Date;
  count: number;
  activeDay: Date;
  selectedDay?: Date | null;
  onDaySelect: (day: Date) => void;
  onFocusDay: (day: Date) => void;
};

function YearDay({
  day,
  count,
  activeDay,
  selectedDay,
  onDaySelect,
  onFocusDay,
}: YearDayProps) {
  const isTodayDay = isToday(day);
  const isSelectable = selectedDay !== undefined;
  const isSelected = isSelectedDay(day, selectedDay);

  function selectDay() {
    onFocusDay(day);
    onDaySelect(day);
  }

  return (
    <button
      type='button'
      className={cn(YEAR_DAY, densityClassOf(count))}
      data-day={dayKeyOf(day)}
      data-today={isTodayDay || undefined}
      data-selected={isSelected || undefined}
      tabIndex={tabIndexOf(day, activeDay)}
      aria-label={dayLabelOf(day, count)}
      aria-current={ariaCurrentDateOf(isTodayDay)}
      aria-pressed={ariaPressedOf(isSelectable, isSelected)}
      onClick={selectDay}
      onFocus={() => onFocusDay(day)}
    >
      {format(day, 'd')}
    </button>
  );
}

type MonthHeadingProps = {
  month: Date;
  onMonthSelect?: (month: Date) => void;
};

function MonthHeading({ month, onMonthSelect }: MonthHeadingProps) {
  const name = format(month, 'MMMM');

  if (!onMonthSelect) {
    return <h3 className='px-1 text-[13px] font-medium'>{name}</h3>;
  }

  return (
    <h3 className='flex'>
      <button
        type='button'
        className='hover:bg-foreground/5 focus-visible:ring-ring/25 cursor-pointer rounded-md px-1 text-[13px] font-medium transition-colors duration-150 outline-none focus-visible:ring-[3px]'
        aria-label={`Open ${format(month, 'MMMM yyyy')}`}
        onClick={() => onMonthSelect(month)}
      >
        {name}
      </button>
    </h3>
  );
}

type YearMonthProps = {
  month: Date;
  counts: Map<string, number>;
  activeDay: Date;
  selectedDay?: Date | null;
  onDaySelect: (day: Date) => void;
  onFocusDay: (day: Date) => void;
  onMonthSelect?: (month: Date) => void;
};

function YearMonth({
  month,
  counts,
  activeDay,
  selectedDay,
  onDaySelect,
  onFocusDay,
  onMonthSelect,
}: YearMonthProps) {
  const days = eachDayOfInterval({ start: month, end: endOfMonth(month) });
  const blanks = Array.from(
    { length: leadingBlanksOf(month) },
    (_, index) => index
  );

  return (
    <section
      aria-label={format(month, 'MMMM yyyy')}
      className='flex min-w-0 flex-col gap-1.5'
    >
      <MonthHeading month={month} onMonthSelect={onMonthSelect} />
      <div className='grid grid-cols-7' aria-hidden='true'>
        {WEEKDAY_INITIALS.map((weekday) => (
          <span
            key={weekday.key}
            className='text-muted-foreground text-center text-[10px] @4xl:text-[11px]'
          >
            {weekday.initial}
          </span>
        ))}
      </div>
      <div className='grid grid-cols-7 gap-y-0.5'>
        {blanks.map((blank) => (
          <span key={`blank-${blank}`} aria-hidden='true' />
        ))}
        {days.map((day) => {
          const dayKey = dayKeyOf(day);
          const count = counts.get(dayKey) ?? 0;
          return (
            <YearDay
              key={dayKey}
              day={day}
              count={count}
              activeDay={activeDay}
              selectedDay={selectedDay}
              onDaySelect={onDaySelect}
              onFocusDay={onFocusDay}
            />
          );
        })}
      </div>
    </section>
  );
}

function YearLegend() {
  return (
    <div
      aria-hidden='true'
      className='text-muted-foreground flex flex-wrap items-center justify-end gap-x-4 gap-y-1 px-4 pb-4 text-xs @xl/year:px-5'
    >
      {LEGEND.map((entry) => (
        <span key={entry.label} className='flex items-center gap-1.5'>
          <span className={cn('size-3 rounded-full', entry.className)} />
          {entry.label}
        </span>
      ))}
    </div>
  );
}

type YearViewProps = {
  currentDate: Date;
  events: CalendarEvent[];
  /** Picks a day: the all-in-one calendar opens it in the day view. */
  onDaySelect: (day: Date) => void;
  /** Opens a month from its name. Without it the names are plain headings. */
  onMonthSelect?: (month: Date) => void;
  /** The picked day, ringed. Leave it out when picking a day leaves the year view. */
  selectedDay?: Date | null;
};

/** Twelve compact months. Days with events are tinted by how busy they are; today is filled. */
export function YearView({
  currentDate,
  events,
  onDaySelect,
  onMonthSelect,
  selectedDay,
}: YearViewProps) {
  const yearStart = startOfYear(currentDate);
  const yearEnd = startOfDay(endOfYear(currentDate));
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const counts = useMemo(() => eventDayCountsOf(events), [events]);
  const { gridRef, activeDay, handleKeyDown, rememberDay } = useRovingDay({
    defaultDay: currentDate,
    firstDay: yearStart,
    lastDay: yearEnd,
  });

  return (
    <div
      data-slot='year-view'
      className='@container/year min-h-0 flex-1 overflow-y-auto'
    >
      <div
        ref={gridRef}
        onKeyDown={handleKeyDown}
        className='grid grid-cols-2 gap-x-5 gap-y-5 p-4 @xl/year:grid-cols-3 @xl/year:gap-x-8 @xl/year:p-5 @4xl/year:grid-cols-4'
      >
        {months.map((month) => (
          <YearMonth
            key={format(month, 'yyyy-MM')}
            month={month}
            counts={counts}
            activeDay={activeDay}
            selectedDay={selectedDay}
            onDaySelect={onDaySelect}
            onFocusDay={rememberDay}
            onMonthSelect={onMonthSelect}
          />
        ))}
      </div>
      <YearLegend />
    </div>
  );
}
