'use client';

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useMemo, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

import {
  DefaultStartHour,
  EventGap,
  EventHeight,
  WeekStartsOn,
} from './constants';
import { DraggableEvent } from './draggable-event';
import { DroppableCell } from './droppable-cell';
import { EventItem } from './event-item';
import { dayKeyOf } from './navigation';
import type { CalendarEvent } from './types';
import { useEventVisibility } from './use-event-visibility';
import { useRovingDay } from './use-roving-day';
import {
  ariaCurrentDateOf,
  eventCountLabelOf,
  getAllEventsForDay,
  getEventsForDay,
  getSpanningEventsForDay,
  sortEvents,
} from './utils';

const REFERENCE_SUNDAY = new Date(2023, 0, 1);

const WEEKDAYS = Array.from({ length: 7 }, (_, index) =>
  format(addDays(REFERENCE_SUNDAY, index), 'EEE')
);

const DAY_NUMBER =
  'mt-1 inline-flex size-6 shrink-0 items-center justify-center self-start rounded-full text-[13px] tabular-nums data-today:bg-primary data-today:font-medium data-today:text-primary-foreground';

const DAY_NUMBER_BUTTON = cn(
  DAY_NUMBER,
  'cursor-pointer outline-none transition-[background-color,scale] duration-150 ease-(--ease-out-strong) active:scale-90',
  'not-data-today:hover:bg-foreground/[0.07] focus-visible:ring-[3px] focus-visible:ring-ring/25'
);

/** Room for two events on a narrow calendar, up to four on a wide one. */
const CELL_CONTENT_AUTO =
  'min-h-[calc((var(--event-height)+var(--event-gap))*2)] @2xl:min-h-[calc((var(--event-height)+var(--event-gap))*3)] @4xl:min-h-[calc((var(--event-height)+var(--event-gap))*4)]';

const CELL_CONTENT_FILL = 'min-h-[calc(var(--event-height)+var(--event-gap))]';

type MonthViewProps = {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (startTime: Date) => void;
  /** Opens a day, for example in the day view. Without it the day numbers are plain text. */
  onDaySelect?: (day: Date) => void;
  /** The rows share the height of the calendar instead of growing to their events. */
  fillHeight?: boolean;
};

function weeksOf(days: Date[]) {
  const weeks: Date[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

function cellContentClassOf(fillHeight: boolean | undefined) {
  if (fillHeight) {
    return CELL_CONTENT_FILL;
  }
  return CELL_CONTENT_AUTO;
}

function dayLabelOf(day: Date, eventCount: number) {
  const date = format(day, 'EEEE, MMMM d');
  if (eventCount === 0) {
    return date;
  }
  return `${date}, ${eventCountLabelOf(eventCount)}`;
}

type MoreEventsProps = {
  day: Date;
  events: CalendarEvent[];
  remainingCount: number;
  onEventSelect: (event: CalendarEvent) => void;
};

function MoreEvents({
  day,
  events,
  remainingCount,
  onEventSelect,
}: MoreEventsProps) {
  const [isOpen, setIsOpen] = useState(false);

  function selectEvent(event: CalendarEvent, clickEvent: React.MouseEvent) {
    clickEvent.stopPropagation();
    setIsOpen(false);
    onEventSelect(event);
  }

  return (
    <Popover modal open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 hover:bg-foreground/5 mt-(--event-gap) flex h-(--event-height) w-full cursor-pointer items-center overflow-hidden rounded-sm px-1 text-left text-[11px] font-medium tabular-nums outline-none select-none focus-visible:ring-[3px] @3xl:px-1.5 @3xl:text-xs'
        aria-label={`${remainingCount} more on ${format(day, 'EEEE, MMMM d')}`}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        +{remainingCount} more
      </PopoverTrigger>
      <PopoverContent
        align='center'
        className='w-60 p-2'
        style={
          {
            '--event-height': `${EventHeight}px`,
            '--event-gap': `${EventGap}px`,
          } as React.CSSProperties
        }
      >
        <p className='px-1.5 pt-1 pb-0.5 text-[13px] font-medium'>
          {format(day, 'EEEE, MMMM d')}
        </p>
        <div className='flex flex-col'>
          {sortEvents(events).map((event) => (
            <EventItem
              key={event.id}
              onClick={(clickEvent) => selectEvent(event, clickEvent)}
              event={event}
              view='month'
              showTime
              isFirstDay={isSameDay(day, new Date(event.start))}
              isLastDay={isSameDay(day, new Date(event.end))}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type DayEventProps = {
  event: CalendarEvent;
  day: Date;
  isHidden: boolean;
  onEventClick: (event: CalendarEvent, clickEvent: React.MouseEvent) => void;
};

function DayEvent({ event, day, isHidden, onEventClick }: DayEventProps) {
  const isFirstDay = isSameDay(day, new Date(event.start));
  const isLastDay = isSameDay(day, new Date(event.end));

  if (!isFirstDay) {
    return (
      <div className='aria-hidden:hidden' aria-hidden={isHidden || undefined}>
        <EventItem
          onClick={(clickEvent) => onEventClick(event, clickEvent)}
          event={event}
          view='month'
          tabIndex={-1}
          isFirstDay={isFirstDay}
          isLastDay={isLastDay}
        >
          <span aria-hidden='true' />
        </EventItem>
      </div>
    );
  }

  return (
    <div className='aria-hidden:hidden' aria-hidden={isHidden || undefined}>
      <DraggableEvent
        event={event}
        view='month'
        onClick={(clickEvent) => onEventClick(event, clickEvent)}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
      />
    </div>
  );
}

type DayNumberProps = {
  day: Date;
  eventCount: number;
  tabIndex: number;
  onDaySelect?: (day: Date) => void;
  onFocusDay: (day: Date) => void;
};

function DayNumber({
  day,
  eventCount,
  tabIndex,
  onDaySelect,
  onFocusDay,
}: DayNumberProps) {
  const isTodayCell = isToday(day);
  const dayNumber = format(day, 'd');

  if (!onDaySelect) {
    return (
      <span className={DAY_NUMBER} data-today={isTodayCell || undefined}>
        {dayNumber}
      </span>
    );
  }

  function openDay(clickEvent: React.MouseEvent) {
    clickEvent.stopPropagation();
    onDaySelect?.(day);
  }

  return (
    <button
      type='button'
      className={DAY_NUMBER_BUTTON}
      data-today={isTodayCell || undefined}
      data-day={dayKeyOf(day)}
      tabIndex={tabIndex}
      aria-label={dayLabelOf(day, eventCount)}
      aria-current={ariaCurrentDateOf(isTodayCell)}
      onClick={openDay}
      onFocus={() => onFocusDay(day)}
    >
      {dayNumber}
    </button>
  );
}

export function MonthView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
  onDaySelect,
  fillHeight,
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = startOfDay(endOfMonth(currentDate));
  const weeks = useMemo(() => {
    const firstDay = startOfMonth(currentDate);
    const lastDay = endOfMonth(firstDay);
    const calendarStart = startOfWeek(firstDay, { weekStartsOn: WeekStartsOn });
    const calendarEnd = endOfWeek(lastDay, { weekStartsOn: WeekStartsOn });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    return weeksOf(days);
  }, [currentDate]);
  const { contentRef, contentHeight, getVisibleEventCount } =
    useEventVisibility({ eventHeight: EventHeight, eventGap: EventGap });
  const { gridRef, handleKeyDown, tabIndexOf, rememberDay } = useRovingDay({
    defaultDay: currentDate,
    firstDay: monthStart,
    lastDay: monthEnd,
  });
  const isMeasured = contentHeight !== null;

  function handleEventClick(
    event: CalendarEvent,
    clickEvent: React.MouseEvent
  ) {
    clickEvent.stopPropagation();
    onEventSelect(event);
  }

  function createEventOn(day: Date) {
    const startTime = new Date(day);
    startTime.setHours(DefaultStartHour, 0, 0);
    onEventCreate(startTime);
  }

  return (
    <div data-slot='month-view' className='flex min-h-0 flex-1 flex-col'>
      <div className='hairline-b border-border grid grid-cols-7'>
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className='text-muted-foreground py-2 text-center text-xs @3xl:text-[13px]'
          >
            {weekday}
          </div>
        ))}
      </div>
      <div
        ref={gridRef}
        onKeyDown={handleKeyDown}
        className={cn(
          'grid min-h-0 flex-1 auto-rows-fr',
          fillHeight && 'overflow-y-auto'
        )}
      >
        {weeks.map((week, weekIndex) => (
          <div
            key={dayKeyOf(week[0])}
            className='grid grid-cols-7 [&:last-child>*]:border-b-0'
          >
            {week.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(events, day);
              const spanningEvents = getSpanningEventsForDay(events, day);
              const cellEvents = sortEvents([...spanningEvents, ...dayEvents]);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isReferenceCell = weekIndex === 0 && dayIndex === 0;
              let visibleCount = 0;
              if (isMeasured) {
                visibleCount = getVisibleEventCount(cellEvents.length);
              }
              const remainingCount = cellEvents.length - visibleCount;
              const hasMore = isMeasured && remainingCount > 0;
              let contentRefOfCell: React.RefObject<HTMLDivElement | null> | null =
                null;
              if (isReferenceCell) {
                contentRefOfCell = contentRef;
              }

              return (
                <div
                  key={dayKeyOf(day)}
                  className='hairline-b hairline-r border-border data-outside-cell:bg-foreground/[0.025] data-outside-cell:text-muted-foreground last:border-r-0'
                  data-outside-cell={!isCurrentMonth || undefined}
                >
                  <DroppableCell
                    id={`month-cell-${dayKeyOf(day)}`}
                    date={day}
                    className='not-data-dragging:hover:bg-foreground/[0.02] cursor-pointer'
                    onClick={() => createEventOn(day)}
                  >
                    <DayNumber
                      day={day}
                      eventCount={cellEvents.length}
                      tabIndex={tabIndexOf(day)}
                      onDaySelect={onDaySelect}
                      onFocusDay={rememberDay}
                    />
                    <div
                      ref={contentRefOfCell}
                      className={cn('flex-1', cellContentClassOf(fillHeight))}
                    >
                      {visibleCount > 0 &&
                        cellEvents.map((event, index) => (
                          <DayEvent
                            key={`${event.id}-${dayKeyOf(day)}`}
                            event={event}
                            day={day}
                            isHidden={index >= visibleCount}
                            onEventClick={handleEventClick}
                          />
                        ))}
                      {hasMore && (
                        <MoreEvents
                          day={day}
                          events={getAllEventsForDay(events, day)}
                          remainingCount={remainingCount}
                          onEventSelect={onEventSelect}
                        />
                      )}
                    </div>
                  </DroppableCell>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
