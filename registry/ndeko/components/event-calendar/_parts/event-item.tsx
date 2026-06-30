'use client';

import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core';
import { differenceInMinutes, isPast } from 'date-fns';

import { cn } from '@/registry/ndeko/lib/utils';

import { EventListRow } from './event-list-row';
import type { CalendarEvent, CalendarView } from './types';
import {
  clockLabelOf,
  eventChipStyle,
  getBorderRadiusClasses,
  isMultiDayEvent,
  timeRangeLabelOf,
} from './utils';

const SHORT_EVENT_MINUTES = 45;

const EVENT_SHARED = [
  'flex size-full min-w-0 cursor-pointer select-none overflow-hidden text-left outline-none',
  'transition-[opacity,background-color] duration-150 ease-(--ease-out-strong)',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
  'data-dragging:cursor-grabbing data-past-event:opacity-60',
].join(' ');

/** A filled block: timed events on the hour grid and anything that spans whole days. */
const EVENT_BLOCK =
  'chip-3d px-1.5 font-medium data-dragging:drop-shadow-lg @3xl:px-2';

/** A dot and a line of text: a timed event inside a month cell, lighter than a span. */
const EVENT_DOT_ROW =
  'items-center gap-1.5 rounded-sm px-1 text-foreground hover:bg-foreground/5 data-dragging:surface-raised @3xl:px-1.5';

type EventShape = 'block' | 'dot';

function shiftedEndOf(event: CalendarEvent, currentTime: Date | undefined) {
  if (!currentTime) {
    return new Date(event.end);
  }
  const duration =
    new Date(event.end).getTime() - new Date(event.start).getTime();
  return new Date(currentTime.getTime() + duration);
}

function startOf(event: CalendarEvent, currentTime: Date | undefined) {
  if (currentTime) {
    return currentTime;
  }
  return new Date(event.start);
}

function shapeClassOf(
  shape: EventShape,
  isFirstDay: boolean,
  isLastDay: boolean
) {
  if (shape === 'dot') {
    return EVENT_DOT_ROW;
  }
  const radius = getBorderRadiusClasses(isFirstDay, isLastDay);
  return cn(EVENT_BLOCK, radius);
}

function accessibleLabelOf(event: CalendarEvent, start: Date, end: Date) {
  if (event.allDay) {
    return `${event.title}, all day`;
  }
  return `${event.title}, ${timeRangeLabelOf(start, end)}`;
}

/** Times stay visible in a popover or a drag preview, and follow the cell width elsewhere. */
function monthTimeClassOf(showTime: boolean | undefined) {
  if (showTime) {
    return '';
  }
  return 'hidden @3xl:inline';
}

function eventTimeLabelOf(event: CalendarEvent, start: Date, end: Date) {
  if (event.allDay) {
    return 'All day';
  }
  return timeRangeLabelOf(start, end);
}

type DndProps = {
  dndListeners?: DraggableSyntheticListeners;
  dndAttributes?: DraggableAttributes;
};

type EventWrapperProps = DndProps & {
  event: CalendarEvent;
  shape: EventShape;
  start: Date;
  end: Date;
  isFirstDay?: boolean;
  isLastDay?: boolean;
  isDragging?: boolean;
  tabIndex?: number;
  onClick?: (event: React.MouseEvent) => void;
  className?: string;
  children: React.ReactNode;
};

function EventWrapper({
  event,
  shape,
  start,
  end,
  isFirstDay = true,
  isLastDay = true,
  isDragging,
  tabIndex,
  onClick,
  className,
  children,
  dndListeners,
}: EventWrapperProps) {
  const isEventInPast = isPast(end);

  // Dragging is for the pointer only: the keyboard moves an event with the dialog's date and
  // time fields, so dnd-kit's keyboard drag hints are not given to assistive technology.
  return (
    <button
      type='button'
      className={cn(
        EVENT_SHARED,
        shapeClassOf(shape, isFirstDay, isLastDay),
        className
      )}
      style={eventChipStyle(event.color)}
      data-dragging={isDragging || undefined}
      data-past-event={isEventInPast || undefined}
      onClick={onClick}
      {...dndListeners}
      aria-label={accessibleLabelOf(event, start, end)}
      tabIndex={tabIndex}
    >
      {children}
    </button>
  );
}

type MonthLabelProps = {
  event: CalendarEvent;
  start: Date;
  showTime?: boolean;
};

function MonthDotLabel({ event, start, showTime }: MonthLabelProps) {
  return (
    <>
      <span
        aria-hidden='true'
        className='size-1.5 shrink-0 rounded-full bg-(--chip)'
      />
      <span
        className={cn(
          'text-muted-foreground shrink-0 tabular-nums',
          monthTimeClassOf(showTime)
        )}
      >
        {clockLabelOf(start)}
      </span>
      <span className='truncate font-medium'>{event.title}</span>
    </>
  );
}

function MonthBarLabel({ event, start, showTime }: MonthLabelProps) {
  const isTimed = !event.allDay;

  return (
    <span className='truncate'>
      {isTimed && (
        <span
          className={cn(
            'font-normal tabular-nums opacity-75',
            monthTimeClassOf(showTime)
          )}
        >
          {clockLabelOf(start)}{' '}
        </span>
      )}
      {event.title}
    </span>
  );
}

type EventItemProps = DndProps & {
  event: CalendarEvent;
  view: CalendarView;
  isDragging?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  showTime?: boolean;
  currentTime?: Date;
  isFirstDay?: boolean;
  isLastDay?: boolean;
  /** `-1` for the copies of a multi-day event, so it takes one tab stop. */
  tabIndex?: number;
  children?: React.ReactNode;
  className?: string;
};

export function EventItem(props: EventItemProps) {
  const {
    event,
    view,
    isDragging,
    onClick,
    showTime,
    currentTime,
    isFirstDay = true,
    isLastDay = true,
    tabIndex,
    children,
    className,
    dndListeners,
  } = props;
  const start = startOf(event, currentTime);
  const end = shiftedEndOf(event, currentTime);
  const isShortEvent = differenceInMinutes(end, start) < SHORT_EVENT_MINUTES;
  const sharedProps = {
    event,
    start,
    end,
    isFirstDay,
    isLastDay,
    isDragging,
    tabIndex,
    onClick,
    dndListeners,
  };

  if (view === 'agenda') {
    return (
      <EventListRow
        event={event}
        day={start}
        onClick={onClick}
        className={className}
      />
    );
  }

  if (view === 'month') {
    const isSpan = isMultiDayEvent(event);
    let shape: EventShape = 'dot';
    if (isSpan) {
      shape = 'block';
    }
    let label = (
      <MonthDotLabel event={event} start={start} showTime={showTime} />
    );
    if (isSpan) {
      label = <MonthBarLabel event={event} start={start} showTime={showTime} />;
    }

    return (
      <EventWrapper
        {...sharedProps}
        shape={shape}
        className={cn(
          'mt-(--event-gap) h-(--event-height) items-center text-[11px] @3xl:text-xs',
          className
        )}
      >
        {children ?? label}
      </EventWrapper>
    );
  }

  return (
    <EventWrapper
      {...sharedProps}
      shape='block'
      className={cn(
        'py-1 text-[11px] @3xl:text-xs',
        isShortEvent && 'items-center',
        !isShortEvent && 'flex-col',
        className
      )}
    >
      {isShortEvent && (
        <span className='truncate'>
          {event.title}{' '}
          {showTime && (
            <span className='font-normal tabular-nums opacity-75'>
              {clockLabelOf(start)}
            </span>
          )}
        </span>
      )}
      {!isShortEvent && (
        <>
          <span className='truncate'>{event.title}</span>
          {showTime && (
            <span className='truncate font-normal tabular-nums opacity-75'>
              {eventTimeLabelOf(event, start, end)}
            </span>
          )}
        </>
      )}
    </EventWrapper>
  );
}
