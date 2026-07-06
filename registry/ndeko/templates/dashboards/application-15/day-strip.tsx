'use client';

import { useId, useState } from 'react';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

import {
  eventsOfDay,
  KIND_WORD,
  STRIP,
  type DayEvent,
  type EventKind,
  type StripDay,
} from './data';
import { rovingTargetOf } from './roving';

const KIND_DOT: Record<EventKind, string> = {
  call: 'bg-info',
  demo: 'bg-primary',
  deadline: 'bg-warning',
};

const KINDS: EventKind[] = ['call', 'demo', 'deadline'];

const MAX_DOTS = 3;

function isWeekendDay(day: StripDay) {
  const isSaturday = day.weekday === 'Sat';
  const isSunday = day.weekday === 'Sun';
  return isSaturday || isSunday;
}

function selectedClassOf(isSelected: boolean) {
  if (isSelected) {
    return 'bg-foreground/[0.07]';
  }
  return 'hover:bg-foreground/[0.04]';
}

function weekdayToneOf(isWeekend: boolean) {
  if (isWeekend) {
    return 'text-muted-foreground/60';
  }
  return 'text-muted-foreground';
}

function todayClassOf(isToday: boolean) {
  if (isToday) {
    return 'bg-primary text-primary-foreground';
  }
  return undefined;
}

function tabIndexOf(index: number, owner: number): 0 | -1 {
  if (index === owner) {
    return 0;
  }
  return -1;
}

type DayCellProps = {
  day: StripDay;
  events: DayEvent[];
  isSelected: boolean;
  isPressed: boolean;
  tabIndex: 0 | -1;
  onSelect: (index: number) => void;
  onFocusDay: (index: number) => void;
};

function DayCell({
  day,
  events,
  isSelected,
  isPressed,
  tabIndex,
  onSelect,
  onFocusDay,
}: DayCellProps) {
  const isToday = day.index === 0;
  const isWeekend = isWeekendDay(day);
  const dots = events.slice(0, MAX_DOTS);
  const spoken = `${day.spoken}, ${countOf(events.length, 'event')}`;

  function select() {
    onSelect(day.index);
  }

  function focusDay() {
    onFocusDay(day.index);
  }

  return (
    <button
      type='button'
      data-day={day.index}
      aria-label={spoken}
      aria-pressed={isSelected}
      tabIndex={tabIndex}
      onClick={select}
      onFocus={focusDay}
      className={cn(
        'focus-visible:ring-ring/25 flex h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg transition-[background-color,scale] duration-150 outline-none focus-visible:ring-[3px] active:scale-[0.97]',
        selectedClassOf(isSelected),
        pressedQuietOf(isPressed)
      )}
    >
      <span className={cn('text-xs', weekdayToneOf(isWeekend))}>
        {day.weekday}
      </span>
      <span
        className={cn(
          'inline-flex size-6 items-center justify-center rounded-full text-[13px] font-medium tabular-nums',
          todayClassOf(isToday)
        )}
      >
        {day.dayOfMonth}
      </span>
      <span aria-hidden='true' className='flex h-1.5 items-center gap-0.5'>
        {dots.map((event) => (
          <span
            key={event.id}
            className={cn('size-1.5 rounded-full', KIND_DOT[event.kind])}
          />
        ))}
      </span>
    </button>
  );
}

type AgendaProps = {
  dayIndex: number | null;
};

function Agenda({ dayIndex }: AgendaProps) {
  if (dayIndex === null) {
    return (
      <p className='text-muted-foreground px-1 py-2 text-xs'>
        Select a day to see what is planned
      </p>
    );
  }
  const day = STRIP[dayIndex];
  const events = eventsOfDay(dayIndex);
  const hasEvents = events.length > 0;

  return (
    <div
      key={dayIndex}
      className='flex flex-col gap-1.5 px-1 py-2 transition-opacity duration-300 starting:opacity-0'
    >
      <p className='text-xs font-medium'>{day.spoken}</p>
      {!hasEvents && (
        <p className='text-muted-foreground text-xs'>Nothing planned</p>
      )}
      {events.map((event) => (
        <p key={event.id} className='flex items-center gap-2 text-[13px]'>
          <span
            aria-hidden='true'
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              KIND_DOT[event.kind]
            )}
          />
          <span className='text-muted-foreground w-11 shrink-0 text-xs tabular-nums'>
            {event.time}
          </span>
          <span className='min-w-0 flex-1 truncate'>{event.title}</span>
          <span className='text-muted-foreground hidden shrink-0 text-xs @md/page:block'>
            {KIND_WORD[event.kind]}
          </span>
        </p>
      ))}
    </div>
  );
}

type DayStripProps = {
  dayIndex: number | null;
  pressed: string | null;
  onSelect: (index: number) => void;
};

export function DayStrip({ dayIndex, pressed, onSelect }: DayStripProps) {
  const titleId = useId();
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const owner = focusIndex ?? dayIndex ?? 0;

  function walk(event: React.KeyboardEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const current = Number(target.dataset.day);
    const next = rovingTargetOf(event.key, current, STRIP.length);
    if (next === null || next === current) {
      return;
    }
    event.preventDefault();
    const selector = `[data-day="${next}"]`;
    const element = event.currentTarget.querySelector<HTMLElement>(selector);
    element?.focus();
  }

  return (
    <section
      data-section='calendar'
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex scroll-mt-4 flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex flex-wrap items-center gap-x-4 gap-y-1'>
        <h2 id={titleId} className='mr-auto text-sm font-medium'>
          Next 14 days
        </h2>
        <ul className='text-muted-foreground flex items-center gap-3 text-xs'>
          {KINDS.map((kind) => (
            <li key={kind} className='flex items-center gap-1.5'>
              <span
                aria-hidden='true'
                className={cn('size-1.5 rounded-full', KIND_DOT[kind])}
              />
              {KIND_WORD[kind]}
            </li>
          ))}
        </ul>
      </header>
      <div
        role='group'
        aria-label='Days. The arrow keys move between them'
        onKeyDown={walk}
        className='grid grid-cols-7 gap-1 @2xl/page:grid-cols-[repeat(14,minmax(0,1fr))]'
      >
        {STRIP.map((day) => (
          <DayCell
            key={day.index}
            day={day}
            events={eventsOfDay(day.index)}
            isSelected={day.index === dayIndex}
            isPressed={pressed === `day-${day.index}`}
            tabIndex={tabIndexOf(day.index, owner)}
            onSelect={onSelect}
            onFocusDay={setFocusIndex}
          />
        ))}
      </div>
      <AnimatedSize>
        <Agenda dayIndex={dayIndex} />
      </AnimatedSize>
    </section>
  );
}
