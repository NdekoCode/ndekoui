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
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useMemo, useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

import { DefaultStartHour, EventGap, EventHeight } from './constants';
import { DraggableEvent } from './draggable-event';
import { DroppableCell } from './droppable-cell';
import { EventItem } from './event-item';
import type { CalendarEvent } from './types';
import { useEventVisibility } from './use-event-visibility';
import {
  getAllEventsForDay,
  getEventsForDay,
  getSpanningEventsForDay,
  sortEvents,
} from './utils';

const REFERENCE_SUNDAY = new Date(2023, 0, 1);

const WEEKDAYS = Array.from({ length: 7 }, (_, index) =>
  format(addDays(REFERENCE_SUNDAY, index), 'EEE')
);

type MonthViewProps = {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (startTime: Date) => void;
};

function weeksOf(days: Date[]) {
  const weeks: Date[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

function dayKeyOf(day: Date) {
  return day.toISOString().slice(0, 10);
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
        className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 hover:bg-foreground/5 mt-(--event-gap) flex h-(--event-height) w-full cursor-pointer items-center overflow-hidden rounded-sm px-1 text-left text-[10px] tabular-nums outline-none select-none focus-visible:ring-[3px] sm:px-2 sm:text-xs'
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <span>
          + {remainingCount} <span className='max-sm:sr-only'>more</span>
        </span>
      </PopoverTrigger>
      <PopoverContent
        align='center'
        className='w-52 p-3'
        style={{ '--event-height': `${EventHeight}px` } as React.CSSProperties}
      >
        <div className='flex flex-col gap-2'>
          <p className='text-[13px] font-medium'>{format(day, 'EEE d')}</p>
          <div className='flex flex-col gap-1'>
            {sortEvents(events).map((event) => (
              <EventItem
                key={event.id}
                onClick={(clickEvent) => selectEvent(event, clickEvent)}
                event={event}
                view='month'
                isFirstDay={isSameDay(day, new Date(event.start))}
                isLastDay={isSameDay(day, new Date(event.end))}
              />
            ))}
          </div>
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
  const isTimed = !event.allDay;

  if (!isFirstDay) {
    return (
      <div className='aria-hidden:hidden' aria-hidden={isHidden || undefined}>
        <EventItem
          onClick={(clickEvent) => onEventClick(event, clickEvent)}
          event={event}
          view='month'
          isFirstDay={isFirstDay}
          isLastDay={isLastDay}
        >
          <span className='invisible' aria-hidden='true'>
            {isTimed && <span>{format(new Date(event.start), 'h:mm')} </span>}
            {event.title}
          </span>
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

export function MonthView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
}: MonthViewProps) {
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    return weeksOf(days);
  }, [currentDate]);
  const { contentRef, contentHeight, getVisibleEventCount } =
    useEventVisibility({ eventHeight: EventHeight, eventGap: EventGap });
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
    <div data-slot='month-view' className='contents'>
      <div className='hairline-b border-border grid grid-cols-7'>
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className='text-muted-foreground py-2 text-center text-[13px]'
          >
            {weekday}
          </div>
        ))}
      </div>
      <div className='grid flex-1 auto-rows-fr'>
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
                  key={day.toString()}
                  className='group hairline-b hairline-r border-border data-outside-cell:bg-foreground/[0.025] data-outside-cell:text-muted-foreground last:border-r-0'
                  data-today={isToday(day) || undefined}
                  data-outside-cell={!isCurrentMonth || undefined}
                >
                  <DroppableCell
                    id={`month-cell-${day.toISOString()}`}
                    date={day}
                    onClick={() => createEventOn(day)}
                  >
                    <div className='group-data-today:bg-primary group-data-today:text-primary-foreground mt-1 inline-flex size-6 items-center justify-center rounded-full text-[13px] tabular-nums'>
                      {format(day, 'd')}
                    </div>
                    <div
                      ref={contentRefOfCell}
                      className='min-h-[calc((var(--event-height)+var(--event-gap))*2)] sm:min-h-[calc((var(--event-height)+var(--event-gap))*3)] lg:min-h-[calc((var(--event-height)+var(--event-gap))*4)]'
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
