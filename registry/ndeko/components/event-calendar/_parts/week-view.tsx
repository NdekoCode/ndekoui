'use client';

import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isToday,
  startOfWeek,
} from 'date-fns';
import { useMemo } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

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

type WeekViewProps = {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (startTime: Date) => void;
};

function isTimedEvent(event: CalendarEvent) {
  return !isMultiDayEvent(event);
}

type AllDayCellProps = {
  day: Date;
  isFirstColumn: boolean;
  weekStart: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent, clickEvent: React.MouseEvent) => void;
};

function AllDayCell({
  day,
  isFirstColumn,
  weekStart,
  events,
  onEventClick,
}: AllDayCellProps) {
  const dayEvents = events.filter((event) => occursOnDay(event, day));

  return (
    <div
      className='hairline-r border-border relative p-1 last:border-r-0'
      data-today={isToday(day) || undefined}
    >
      {dayEvents.map((event) => {
        const eventStart = new Date(event.start);
        const isFirstDay = isSameDay(day, eventStart);
        const isLastDay = isSameDay(day, new Date(event.end));
        const startsBeforeWeek = isBefore(eventStart, weekStart);
        const isFirstVisibleDay = isFirstColumn && startsBeforeWeek;
        const shouldShowTitle = isFirstDay || isFirstVisibleDay;

        return (
          <EventItem
            key={`spanning-${event.id}`}
            onClick={(clickEvent) => onEventClick(event, clickEvent)}
            event={event}
            view='month'
            isFirstDay={isFirstDay}
            isLastDay={isLastDay}
          >
            <span
              className={cn('truncate', !shouldShowTitle && 'invisible')}
              aria-hidden={!shouldShowTitle}
            >
              {event.title}
            </span>
          </EventItem>
        );
      })}
    </div>
  );
}

export function WeekView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
}: WeekViewProps) {
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate]
  );
  const days = useMemo(() => {
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate, weekStart]);
  const hours = useMemo(() => hoursOfDay(currentDate), [currentDate]);

  const allDayEvents = useMemo(() => {
    const multiDayEvents = events.filter(isMultiDayEvent);
    return multiDayEvents.filter((event) =>
      days.some((day) => occursOnDay(event, day))
    );
  }, [events, days]);

  const positionedDayEvents = useMemo(() => {
    const timedEvents = events.filter(isTimedEvent);
    return days.map((day) => {
      const dayEvents = timedEvents.filter((event) => occursOnDay(event, day));
      return positionTimedEvents(dayEvents, day);
    });
  }, [days, events]);

  const { currentTimePosition, currentTimeVisible } = useCurrentTimeIndicator(
    currentDate,
    'week'
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
    <div data-slot='week-view' className='flex h-full flex-col'>
      <div className='bg-card/80 hairline-b border-border sticky top-0 z-30 grid grid-cols-8 backdrop-blur-md'>
        <div className='text-muted-foreground py-2 text-center text-[13px]'>
          <span className='max-[479px]:sr-only'>
            {format(currentDate, 'O')}
          </span>
        </div>
        {days.map((day) => (
          <div
            key={day.toString()}
            className='data-today:text-foreground text-muted-foreground py-2 text-center text-[13px] tabular-nums data-today:font-medium'
            data-today={isToday(day) || undefined}
          >
            <span className='sm:hidden' aria-hidden='true'>
              {format(day, 'E')[0]} {format(day, 'd')}
            </span>
            <span className='max-sm:hidden'>{format(day, 'EEE dd')}</span>
          </div>
        ))}
      </div>

      {showAllDaySection && (
        <div className='hairline-b border-border bg-foreground/[0.025]'>
          <div className='grid grid-cols-8'>
            <div className='hairline-r border-border relative'>
              <span className='text-muted-foreground absolute bottom-0 left-0 h-6 w-16 max-w-full pe-2 text-right text-[10px] sm:pe-4 sm:text-xs'>
                All day
              </span>
            </div>
            {days.map((day, dayIndex) => (
              <AllDayCell
                key={day.toString()}
                day={day}
                isFirstColumn={dayIndex === 0}
                weekStart={weekStart}
                events={allDayEvents}
                onEventClick={handleEventClick}
              />
            ))}
          </div>
        </div>
      )}

      <div className='grid flex-1 grid-cols-8 overflow-hidden'>
        <div className='hairline-r border-border grid auto-cols-fr'>
          <HourLabels hours={hours} />
        </div>

        {days.map((day, dayIndex) => {
          const isTodayColumn = isToday(day);
          const showsCurrentTime = currentTimeVisible && isTodayColumn;

          return (
            <div
              key={day.toString()}
              className='hairline-r border-border relative grid auto-cols-fr last:border-r-0'
              data-today={isTodayColumn || undefined}
            >
              <PositionedEvents
                positionedEvents={positionedDayEvents[dayIndex] ?? []}
                view='week'
                onEventClick={handleEventClick}
              />
              {showsCurrentTime && (
                <CurrentTimeLine position={currentTimePosition} />
              )}
              <QuarterSlots
                day={day}
                hours={hours}
                idPrefix='week-cell'
                onEventCreate={onEventCreate}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
