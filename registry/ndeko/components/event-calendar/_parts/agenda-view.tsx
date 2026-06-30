'use client';

import { addDays, format, isSameMonth, isToday } from 'date-fns';
import { useMemo } from 'react';

import { CalendarIcon } from '@/registry/ndeko/lib/icons';

import { AgendaDaysToShow } from './constants';
import { EventListRow } from './event-list-row';
import { dayKeyOf } from './navigation';
import type { CalendarEvent } from './types';
import { getAgendaEventsForDay } from './utils';

type AgendaViewProps = {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
};

type AgendaDay = {
  day: Date;
  events: CalendarEvent[];
};

function AgendaEmptyState() {
  return (
    <div className='flex flex-col items-center justify-center gap-1 px-4 py-20 text-center'>
      <span className='keycap-3d text-muted-foreground mb-2 flex size-10 items-center justify-center rounded-lg'>
        <CalendarIcon className='size-5' />
      </span>
      <h3 className='text-sm font-medium'>
        No events in these {AgendaDaysToShow} days
      </h3>
      <p className='text-muted-foreground text-[13px]'>
        Pick New event to plan one.
      </p>
    </div>
  );
}

function agendaDayLabelOf(day: Date) {
  const date = format(day, 'EEEE, MMMM d');
  if (isToday(day)) {
    return `Today, ${date}`;
  }
  return date;
}

function showsMonthOf(agendaDays: AgendaDay[], index: number) {
  if (index === 0) {
    return true;
  }
  const previousDay = agendaDays[index - 1].day;
  return !isSameMonth(previousDay, agendaDays[index].day);
}

type AgendaDateProps = {
  day: Date;
  showsMonth: boolean;
};

function AgendaDate({ day, showsMonth }: AgendaDateProps) {
  const isTodayDay = isToday(day);

  return (
    <div
      aria-hidden='true'
      className='group/date flex flex-col items-center pt-1.5 leading-none'
      data-today={isTodayDay || undefined}
    >
      <span className='text-muted-foreground group-data-today/date:text-primary-ink text-xs'>
        {format(day, 'EEE')}
      </span>
      <span className='group-data-today/date:text-primary-ink mt-1 text-lg font-semibold tabular-nums'>
        {format(day, 'd')}
      </span>
      {showsMonth && (
        <span className='text-muted-foreground mt-1 text-[11px]'>
          {format(day, 'MMM')}
        </span>
      )}
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

  return (
    <div
      data-slot='agenda-view'
      className='hairline-t border-border max-h-(--calendar-scroll-height) min-h-0 flex-1 overflow-y-auto'
    >
      {!hasEvents && <AgendaEmptyState />}
      {hasEvents && (
        <ol className='flex flex-col gap-4 p-2 @2xl:p-3'>
          {agendaDays.map((agendaDay, index) => (
            <li
              key={dayKeyOf(agendaDay.day)}
              className='grid grid-cols-[3rem_minmax(0,1fr)] gap-1 @2xl:grid-cols-[3.5rem_minmax(0,1fr)] @2xl:gap-2'
            >
              <AgendaDate
                day={agendaDay.day}
                showsMonth={showsMonthOf(agendaDays, index)}
              />
              <ul
                className='flex flex-col'
                aria-label={agendaDayLabelOf(agendaDay.day)}
              >
                {agendaDay.events.map((event) => (
                  <li key={event.id}>
                    <EventListRow
                      event={event}
                      day={agendaDay.day}
                      onClick={() => onEventSelect(event)}
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
