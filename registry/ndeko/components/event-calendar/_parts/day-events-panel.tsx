'use client';

import { format, isToday } from 'date-fns';

import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

import { EventListRow } from './event-list-row';
import type { CalendarEvent } from './types';
import {
  defaultStartOf,
  eventCountLabelOf,
  getAgendaEventsForDay,
} from './utils';

type DayEventsPanelProps = {
  day: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  /** Offers to plan an event when the day is empty. */
  onEventCreate?: (startTime: Date) => void;
  className?: string;
};

type EmptyDayProps = {
  day: Date;
  onEventCreate?: (startTime: Date) => void;
};

function EmptyDay({ day, onEventCreate }: EmptyDayProps) {
  const canCreate = Boolean(onEventCreate);

  function createEvent() {
    const start = defaultStartOf(day);
    onEventCreate?.(start);
  }

  return (
    <div className='hairline-border border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border-dashed px-3 py-3'>
      <p className='text-muted-foreground text-[13px]'>No events on this day</p>
      {canCreate && (
        <Button variant='outline' size='sm' onClick={createEvent}>
          <PlusIcon />
          New event
        </Button>
      )}
    </div>
  );
}

/** The events of one day as a list, with a heading that names the day and counts them. */
export function DayEventsPanel({
  day,
  events,
  onEventSelect,
  onEventCreate,
  className,
}: DayEventsPanelProps) {
  const dayEvents = getAgendaEventsForDay(events, day);
  const hasEvents = dayEvents.length > 0;
  const isTodayDay = isToday(day);

  return (
    <section
      aria-label={format(day, 'EEEE, MMMM d')}
      className={cn('flex min-w-0 flex-col gap-2', className)}
    >
      <header
        aria-live='polite'
        className='flex items-baseline justify-between gap-3 px-2'
      >
        <h3 className='flex min-w-0 items-baseline gap-2 text-sm font-medium'>
          <span className='truncate'>{format(day, 'EEEE, MMMM d')}</span>
          {isTodayDay && (
            <span className='text-primary-ink shrink-0 text-xs font-normal'>
              Today
            </span>
          )}
        </h3>
        <p className='text-muted-foreground shrink-0 text-xs tabular-nums'>
          {eventCountLabelOf(dayEvents.length)}
        </p>
      </header>
      <AnimatedSize>
        {hasEvents && (
          <ul className='flex flex-col'>
            {dayEvents.map((event) => (
              <li key={event.id}>
                <EventListRow
                  event={event}
                  day={day}
                  onClick={() => onEventSelect(event)}
                />
              </li>
            ))}
          </ul>
        )}
        {!hasEvents && <EmptyDay day={day} onEventCreate={onEventCreate} />}
      </AnimatedSize>
    </section>
  );
}
