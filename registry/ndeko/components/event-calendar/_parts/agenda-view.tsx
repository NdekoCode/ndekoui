'use client';

import { addDays, format, isToday } from 'date-fns';
import { useMemo } from 'react';

import { CalendarIcon } from '@/registry/ndeko/lib/icons';

import { AgendaDaysToShow } from './constants';
import { EventItem } from './event-item';
import type { CalendarEvent } from './types';
import { getAgendaEventsForDay } from './utils';

type AgendaViewProps = {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
};

function AgendaEmptyState() {
  return (
    <div className='flex min-h-[70svh] flex-col items-center justify-center gap-1 py-16 text-center'>
      <span className='keycap-3d text-muted-foreground mb-2 flex size-10 items-center justify-center rounded-lg'>
        <CalendarIcon className='size-5' />
      </span>
      <h3 className='text-sm font-medium'>No events in these 30 days</h3>
      <p className='text-muted-foreground text-[13px]'>
        Pick New event to plan one.
      </p>
    </div>
  );
}

export function AgendaView({
  currentDate,
  events,
  onEventSelect,
}: AgendaViewProps) {
  const agendaDays = useMemo(() => {
    const days = Array.from({ length: AgendaDaysToShow }, (_, index) =>
      addDays(currentDate, index)
    );
    const withEvents = days.map((day) => ({
      day,
      events: getAgendaEventsForDay(events, day),
    }));
    return withEvents.filter((agendaDay) => agendaDay.events.length > 0);
  }, [currentDate, events]);
  const hasEvents = agendaDays.length > 0;

  function handleEventClick(
    event: CalendarEvent,
    clickEvent: React.MouseEvent
  ) {
    clickEvent.stopPropagation();
    onEventSelect(event);
  }

  return (
    <div className='hairline-t border-border px-4'>
      {!hasEvents && <AgendaEmptyState />}
      {agendaDays.map(({ day, events: dayEvents }) => (
        <div
          key={day.toString()}
          className='hairline-t border-border relative my-12'
        >
          <span
            className='bg-card absolute -top-3 left-0 flex h-6 items-center pe-4 text-[10px] uppercase data-today:font-medium sm:text-xs'
            data-today={isToday(day) || undefined}
          >
            {format(day, 'd MMM, EEEE')}
          </span>
          <div className='mt-6 flex flex-col gap-2'>
            {dayEvents.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                view='agenda'
                onClick={(clickEvent) => handleEventClick(event, clickEvent)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
