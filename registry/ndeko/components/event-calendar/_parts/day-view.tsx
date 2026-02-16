'use client';

import { isSameDay } from 'date-fns';
import { useMemo } from 'react';

import { EventItem } from './event-item';
import {
  CurrentTimeLine,
  HourLabels,
  hoursOfDay,
  PositionedEvents,
  QuarterSlots,
} from './time-grid';
import type { CalendarEvent } from './types';
import { useCurrentTimeIndicator } from './use-current-time-indicator';
import { isMultiDayEvent, occursOnDay, positionTimedEvents } from './utils';

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
    <div data-slot='day-view' className='contents'>
      {showAllDaySection && (
        <div className='hairline-t border-border bg-foreground/[0.025]'>
          <div className='grid grid-cols-[3rem_1fr] sm:grid-cols-[4rem_1fr]'>
            <div className='relative'>
              <span className='text-muted-foreground absolute bottom-0 left-0 h-6 w-16 max-w-full pe-2 text-right text-[10px] sm:pe-4 sm:text-xs'>
                All day
              </span>
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
                  <span className='truncate'>{event.title}</span>
                </EventItem>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className='hairline-t border-border grid flex-1 grid-cols-[3rem_1fr] overflow-hidden sm:grid-cols-[4rem_1fr]'>
        <div>
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
    </div>
  );
}
