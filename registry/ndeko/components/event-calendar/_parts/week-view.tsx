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

import { WeekStartsOn } from './constants';
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
import {
  ariaCurrentDateOf,
  isMultiDayEvent,
  occursOnDay,
  positionTimedEvents,
} from './utils';

/** An hour gutter, then seven days that keep a readable width by scrolling sideways on a phone. */
const WEEK_COLUMNS = 'grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]';

const STICKY_GUTTER = 'bg-card sticky left-0 z-20';

const DAY_NUMBER =
  'inline-flex size-6 items-center justify-center rounded-full text-[13px] tabular-nums group-data-today/day:bg-primary group-data-today/day:font-medium group-data-today/day:text-primary-foreground';

type WeekViewProps = {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (startTime: Date) => void;
  /** Opens a day from its heading. Without it the headings are plain text. */
  onDaySelect?: (day: Date) => void;
};

function isTimedEvent(event: CalendarEvent) {
  return !isMultiDayEvent(event);
}

function DayHeadingContent({ day }: { day: Date }) {
  return (
    <>
      <span className='text-muted-foreground text-xs'>
        {format(day, 'EEE')}
      </span>
      <span className={DAY_NUMBER}>{format(day, 'd')}</span>
    </>
  );
}

type DayHeadingProps = {
  day: Date;
  onDaySelect?: (day: Date) => void;
};

function DayHeading({ day, onDaySelect }: DayHeadingProps) {
  const isTodayColumn = isToday(day);

  if (!onDaySelect) {
    return (
      <div
        className='group/day flex items-center justify-center gap-1.5 py-2'
        data-today={isTodayColumn || undefined}
      >
        <DayHeadingContent day={day} />
      </div>
    );
  }

  return (
    <div className='flex justify-center py-1.5'>
      <button
        type='button'
        className='group/day hover:bg-foreground/5 focus-visible:ring-ring/25 flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors duration-150 outline-none focus-visible:ring-[3px]'
        data-today={isTodayColumn || undefined}
        aria-label={format(day, 'EEEE, MMMM d')}
        aria-current={ariaCurrentDateOf(isTodayColumn)}
        onClick={() => onDaySelect(day)}
      >
        <DayHeadingContent day={day} />
      </button>
    </div>
  );
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
    <div className='hairline-r border-border relative p-1 last:border-r-0'>
      {dayEvents.map((event) => {
        const eventStart = new Date(event.start);
        const isFirstDay = isSameDay(day, eventStart);
        const isLastDay = isSameDay(day, new Date(event.end));
        const startsBeforeWeek = isBefore(eventStart, weekStart);
        const isFirstVisibleDay = isFirstColumn && startsBeforeWeek;
        const shouldShowTitle = isFirstDay || isFirstVisibleDay;
        let tabIndex: number | undefined;
        if (!shouldShowTitle) {
          tabIndex = -1;
        }

        return (
          <EventItem
            key={`spanning-${event.id}`}
            onClick={(clickEvent) => onEventClick(event, clickEvent)}
            event={event}
            view='month'
            tabIndex={tabIndex}
            isFirstDay={isFirstDay}
            isLastDay={isLastDay}
          >
            <span
              className={cn('truncate', !shouldShowTitle && 'invisible')}
              aria-hidden='true'
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
  onDaySelect,
}: WeekViewProps) {
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: WeekStartsOn }),
    [currentDate]
  );
  const days = useMemo(() => {
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: WeekStartsOn });
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
  const gridLabel = `Week of ${format(weekStart, 'MMMM d')}`;

  function handleEventClick(
    event: CalendarEvent,
    clickEvent: React.MouseEvent
  ) {
    clickEvent.stopPropagation();
    onEventSelect(event);
  }

  return (
    <div data-slot='week-view' className='flex min-h-0 flex-1 flex-col'>
      <TimeGridScroller label={gridLabel}>
        <div className='min-w-[42rem] @3xl:min-w-0'>
          <div className='bg-card hairline-b border-border sticky top-0 z-30'>
            <div className={WEEK_COLUMNS}>
              <div className={STICKY_GUTTER} />
              {days.map((day) => (
                <DayHeading
                  key={day.toString()}
                  day={day}
                  onDaySelect={onDaySelect}
                />
              ))}
            </div>
            {showAllDaySection && (
              <div className={cn(WEEK_COLUMNS, 'hairline-t border-border')}>
                <div
                  className={cn(
                    STICKY_GUTTER,
                    'hairline-r border-border text-muted-foreground flex items-end justify-end pe-2 pb-2 text-[10px] @3xl:text-xs'
                  )}
                >
                  All day
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
            )}
          </div>

          <div className={WEEK_COLUMNS}>
            <div className={cn(STICKY_GUTTER, 'hairline-r border-border')}>
              <HourLabels hours={hours} />
            </div>

            {days.map((day, dayIndex) => {
              const isTodayColumn = isToday(day);
              const showsCurrentTime = currentTimeVisible && isTodayColumn;

              return (
                <div
                  key={day.toString()}
                  className='hairline-r border-border data-today:bg-primary/[0.025] relative last:border-r-0'
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
      </TimeGridScroller>
    </div>
  );
}
