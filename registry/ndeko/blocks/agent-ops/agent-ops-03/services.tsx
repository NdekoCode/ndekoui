'use client';

import { useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { cn } from '@/registry/ndeko/lib/utils';

import {
  dateLabelOf,
  DAY_COUNT,
  dayEventOf,
  FAULT_MINUTES,
  SERVICES,
  TODAY,
  uptimeOf,
  type DayEvent,
  type DayStatus,
  type Service,
  type ServiceId,
} from './data';

/** Phones show the last 45 days: 90 cells in 343 pixels are too thin to read or to touch. */
const PHONE_DAYS = 45;

const FIRST_PHONE_DAY = DAY_COUNT - PHONE_DAYS;

const DAYS = Array.from({ length: DAY_COUNT }, (_, day) => day);

const DAY_WORD: Record<DayStatus, string> = {
  ok: 'No incident',
  degraded: 'Slower than usual',
  outage: 'Down',
};

const DAY_TONE: Record<DayStatus, string> = {
  ok: 'bg-success/50',
  degraded: 'bg-warning',
  outage: 'bg-destructive',
};

const STATE_WORDS = ['Operational', 'Degraded'];

const UPTIME_FORMAT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** The bubble follows the day it reads and stops at both ends of the bar, so it never leaves the block. */
const BUBBLE_LEFT =
  'clamp(4.75rem, calc((var(--day) - var(--first-day) + 0.5) / var(--day-count) * 100%), calc(100% - 4.75rem))';

type BubbleStyle = React.CSSProperties & { '--day': number };

function minutesOf(event: DayEvent) {
  if (event.status === 'ok') {
    return 'Every request answered in time';
  }
  if (event.minutes === 1) {
    return '1 minute affected';
  }
  return `${event.minutes} minutes affected`;
}

function stateWordOf(isDegraded: boolean) {
  if (isDegraded) {
    return 'Degraded';
  }
  return 'Operational';
}

function stateToneOf(isDegraded: boolean) {
  if (isDegraded) {
    return 'text-warning-foreground';
  }
  return 'text-muted-foreground';
}

function dotToneOf(isDegraded: boolean) {
  if (isDegraded) {
    return 'bg-warning';
  }
  return 'bg-success';
}

/** The picked service is tinted as a whole, so its button only answers the pointer when it is not picked. */
function rowToneOf(isSelected: boolean) {
  if (isSelected) {
    return undefined;
  }
  return 'hover:bg-foreground/[0.04]';
}

function pressedQuietOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.985] bg-foreground/[0.07]';
  }
  return undefined;
}

function cellLiftOf(isRead: boolean) {
  if (isRead) {
    return '-translate-y-0.5 opacity-100';
  }
  return 'opacity-75';
}

function dayOfTarget(target: EventTarget) {
  if (!(target instanceof HTMLElement)) {
    return null;
  }
  const value = target.dataset.day;
  if (value === undefined) {
    return null;
  }
  return Number(value);
}

function firstDayOf(bar: HTMLElement) {
  const value = getComputedStyle(bar).getPropertyValue('--first-day');
  return Number(value);
}

function steppedDayOf(key: string, current: number, firstDay: number) {
  if (key === 'ArrowRight') {
    return Math.min(current + 1, TODAY);
  }
  if (key === 'ArrowLeft') {
    return Math.max(current - 1, firstDay);
  }
  if (key === 'Home') {
    return firstDay;
  }
  if (key === 'End') {
    return TODAY;
  }
  return null;
}

type UptimeBarProps = {
  service: Service;
  todayEvent: DayEvent | null;
  /** The day the demonstration reads, shown while no pointer and no key reads another. */
  demoDay: number | null;
};

function UptimeBar({ service, todayEvent, demoDay }: UptimeBarProps) {
  const [pointerDay, setPointerDay] = useState<number | null>(null);
  const [keyDay, setKeyDay] = useState<number | null>(null);
  const [lastDay, setLastDay] = useState(TODAY);
  const activeDay = pointerDay ?? keyDay ?? demoDay;
  const isReading = activeDay !== null;
  if (activeDay !== null && activeDay !== lastDay) {
    setLastDay(activeDay);
  }

  function eventOf(day: number) {
    const isToday = day === TODAY;
    if (isToday && todayEvent) {
      return todayEvent;
    }
    return dayEventOf(service.id, day);
  }

  const shownDay = activeDay ?? lastDay;
  const shownEvent = eventOf(shownDay);
  const shownDate = dateLabelOf(shownDay);
  const shownWord = DAY_WORD[shownEvent.status];
  const shownMinutes = minutesOf(shownEvent);
  const bubbleStyle: BubbleStyle = { left: BUBBLE_LEFT, '--day': shownDay };
  const isReadingByKeys = keyDay !== null;
  const spokenReading = `${shownDate}: ${shownWord}. ${shownMinutes}`;

  function point(event: React.PointerEvent<HTMLDivElement>) {
    const day = dayOfTarget(event.target);
    if (day !== null) {
      setPointerDay(day);
    }
  }

  function leave(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse') {
      setPointerDay(null);
    }
  }

  function focus(event: React.FocusEvent<HTMLDivElement>) {
    const isKeyboardFocus = event.currentTarget.matches(':focus-visible');
    if (isKeyboardFocus) {
      setKeyDay(lastDay);
    }
  }

  function blur() {
    setKeyDay(null);
    setPointerDay(null);
  }

  function step(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      setKeyDay(null);
      return;
    }
    const firstDay = firstDayOf(event.currentTarget);
    const current = keyDay ?? lastDay;
    const next = steppedDayOf(event.key, current, firstDay);
    if (next === null) {
      return;
    }
    event.preventDefault();
    setPointerDay(null);
    setKeyDay(next);
  }

  return (
    <div className='relative [--day-count:45] [--first-day:45] @md:[--day-count:90] @md:[--first-day:0]'>
      <div
        role='group'
        tabIndex={0}
        aria-label={`Uptime of ${service.name}, day by day. Use the arrow keys to read each day.`}
        onPointerMove={point}
        onPointerDown={point}
        onPointerLeave={leave}
        onFocus={focus}
        onBlur={blur}
        onKeyDown={step}
        className='focus-visible:ring-ring/25 flex h-7 touch-pan-y items-stretch gap-px rounded-sm outline-none focus-visible:ring-[3px]'
      >
        {DAYS.map((day) => {
          const event = eventOf(day);
          const isPhoneDay = day >= FIRST_PHONE_DAY;
          const isRead = isReading && day === activeDay;
          return (
            <span
              key={day}
              data-day={day}
              className={cn(
                'min-w-0 flex-1 rounded-[2px] transition-[translate,opacity,background-color] duration-100',
                DAY_TONE[event.status],
                cellLiftOf(isRead),
                !isPhoneDay && 'hidden @md:block'
              )}
            />
          );
        })}
      </div>
      <div
        aria-hidden='true'
        style={bubbleStyle}
        className='pointer-events-none absolute bottom-full z-10 mb-1.5 w-0'
      >
        <div
          className={cn(
            'surface-raised flex w-36 -translate-x-1/2 flex-col gap-0.5 rounded-lg px-2.5 py-1.5 text-xs',
            'origin-bottom transition-[opacity,scale] duration-[125ms] ease-(--ease-out-strong)',
            !isReading && 'scale-[0.97] opacity-0'
          )}
        >
          <span className='text-muted-foreground tabular-nums'>
            {shownDate}
          </span>
          <span className='font-medium'>{shownWord}</span>
          <span className='text-muted-foreground tabular-nums'>
            {shownMinutes}
          </span>
        </div>
      </div>
      <span aria-live='polite' className='sr-only'>
        {isReadingByKeys && spokenReading}
      </span>
    </div>
  );
}

type ServiceRowProps = {
  service: Service;
  isSelected: boolean;
  isDegraded: boolean;
  isPressed: boolean;
  todayEvent: DayEvent | null;
  demoDay: number | null;
  onSelect: (id: ServiceId) => void;
};

function ServiceRow({
  service,
  isSelected,
  isDegraded,
  isPressed,
  todayEvent,
  demoDay,
  onSelect,
}: ServiceRowProps) {
  const lostToday = todayEvent?.minutes ?? 0;
  const uptime = uptimeOf(service.id, lostToday);
  const uptimeText = UPTIME_FORMAT.format(uptime);

  return (
    <li
      className={cn(
        'flex flex-col gap-2 rounded-lg px-2 pt-1 pb-2.5 transition-colors duration-200',
        isSelected && 'bg-foreground/[0.03]'
      )}
    >
      <button
        type='button'
        aria-pressed={isSelected}
        onClick={() => onSelect(service.id)}
        className={cn(
          'focus-visible:ring-ring/25 -mx-1 flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-1 text-start transition-[background-color,scale] duration-150 outline-none focus-visible:ring-[3px]',
          rowToneOf(isSelected),
          pressedQuietOf(isPressed)
        )}
      >
        <span
          aria-hidden='true'
          className={cn(
            'size-2 shrink-0 rounded-full transition-colors duration-300',
            dotToneOf(isDegraded)
          )}
        />
        <span className='flex min-w-0 flex-1 flex-col leading-tight'>
          <span className='truncate text-[13px] font-medium'>
            {service.name}
          </span>
          <span
            className={cn(
              'text-xs transition-colors duration-300',
              stateToneOf(isDegraded)
            )}
          >
            <WordRoll text={stateWordOf(isDegraded)} labels={STATE_WORDS} />
          </span>
        </span>
        <span className='flex shrink-0 flex-col items-end leading-tight'>
          <span className='text-[13px] font-medium tabular-nums'>
            {uptimeText}%
          </span>
          <span className='text-muted-foreground text-xs'>
            uptime over {DAY_COUNT} days
          </span>
        </span>
      </button>
      <UptimeBar service={service} todayEvent={todayEvent} demoDay={demoDay} />
      <div
        aria-hidden='true'
        className='text-muted-foreground flex justify-between text-[11px]'
      >
        <span className='@md:hidden'>{PHONE_DAYS} days ago</span>
        <span className='hidden @md:inline'>{DAY_COUNT} days ago</span>
        <span>Today</span>
      </div>
    </li>
  );
}

type ServiceListProps = {
  selected: ServiceId;
  hasFaultToday: boolean;
  isFaultOpen: boolean;
  demoReading: { serviceId: ServiceId; day: number } | null;
  pressed: string | null;
  onSelect: (id: ServiceId) => void;
};

const FAULT_TODAY: DayEvent = { status: 'degraded', minutes: FAULT_MINUTES };

function todayEventOf(serviceId: ServiceId, hasFaultToday: boolean) {
  const isHit = serviceId === 'models' && hasFaultToday;
  if (isHit) {
    return FAULT_TODAY;
  }
  return null;
}

function demoDayOf(
  serviceId: ServiceId,
  reading: { serviceId: ServiceId; day: number } | null
) {
  if (reading?.serviceId === serviceId) {
    return reading.day;
  }
  return null;
}

export function ServiceList({
  selected,
  hasFaultToday,
  isFaultOpen,
  demoReading,
  pressed,
  onSelect,
}: ServiceListProps) {
  return (
    <section
      aria-label='Services'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] @container rounded-xl p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <ul className='flex flex-col gap-0.5'>
        {SERVICES.map((service) => {
          const isModels = service.id === 'models';
          return (
            <ServiceRow
              key={service.id}
              service={service}
              isSelected={selected === service.id}
              isDegraded={isModels && isFaultOpen}
              isPressed={pressed === `service-${service.id}`}
              todayEvent={todayEventOf(service.id, hasFaultToday)}
              demoDay={demoDayOf(service.id, demoReading)}
              onSelect={onSelect}
            />
          );
        })}
      </ul>
    </section>
  );
}
