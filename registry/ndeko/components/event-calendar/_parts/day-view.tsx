'use client';

import { format, isSameDay } from 'date-fns';
import { useMemo } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { EventItem } from './event-item';
import {
  CurrentTimeLine,
  HourLabels,
  hoursOfDay,
  PositionedEvents,
  QuarterSlots,
  TimeGridScroller,
} from './time-grid';
import type { CalendarEvent } from './types';
import { useCurrentTimeIndicator } from './use-current-time-indicator';
import { isMultiDayEvent, occursOnDay, positionTimedEvents } from './utils';

const DAY_COLUMNS = 'grid grid-cols-[3.5rem_minmax(0,1fr)]';

type DayViewProps = {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (startTime: Date) => void;
};

export function DayView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
}: DayViewProps) {
  const hours = useMemo(() => hoursOfDay(currentDate), [currentDate]);

  const dayEvents = useMemo(
    () => events.filter((event) => occursOnDay(event, currentDate)),
    [currentDate, events]
  );

  const allDayEvents = useMemo(
    () => dayEvents.filter(isMultiDayEvent),
    [dayEvents]
  );

  const positionedEvents = useMemo(() => {
    const timedEvents = dayEvents.filter((event) => !isMultiDayEvent(event));
    return positionTimedEvents(timedEvents, currentDate);
  }, [currentDate, dayEvents]);

  const { currentTimePosition, currentTimeVisible } = useCurrentTimeIndicator(
    currentDate,
    'day'
  );
  const showAllDaySection = allDayEvents.length > 0;

  function handleEventClick(
    event: CalendarEvent,
    clickEvent: React.MouseEvent
  ) {
    clickEvent.stopPropagation();
    onEventSelect(event);
  }

  return (
    <div
      data-slot='day-view'
      className='hairline-t border-border flex min-h-0 flex-1 flex-col'
    >
      <TimeGridScroller label={format(currentDate, 'EEEE, MMMM d')}>
        {showAllDaySection && (
          <div
            className={cn(
              DAY_COLUMNS,
              'bg-card hairline-b border-border sticky top-0 z-30'
            )}
          >
            <div className='hairline-r border-border text-muted-foreground flex items-end justify-end pe-2 pb-2 text-[10px] @3xl:text-xs'>
              All day
            </div>
            <div className='relative p-1'>
              {allDayEvents.map((event) => (
                <EventItem
                  key={`spanning-${event.id}`}
                  onClick={(clickEvent) => handleEventClick(event, clickEvent)}
                  event={event}
                  view='month'
                  isFirstDay={isSameDay(currentDate, new Date(event.start))}
                  isLastDay={isSameDay(currentDate, new Date(event.end))}
                >
                  <span className='truncate' aria-hidden='true'>
                    {event.title}
                  </span>
                </EventItem>
              ))}
            </div>
          </div>
        )}

        <div className={DAY_COLUMNS}>
          <div className='hairline-r border-border'>
            <HourLabels hours={hours} />
          </div>

          <div className='relative'>
            <PositionedEvents
              positionedEvents={positionedEvents}
              view='day'
              onEventClick={handleEventClick}
            />
            {currentTimeVisible && (
              <CurrentTimeLine position={currentTimePosition} />
            )}
            <QuarterSlots
              day={currentDate}
              hours={hours}
              idPrefix='day-cell'
              onEventCreate={onEventCreate}
            />
          </div>
        </div>
      </TimeGridScroller>
    </div>
  );
}
