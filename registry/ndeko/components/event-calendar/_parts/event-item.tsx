'use client';

import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core';
import { differenceInMinutes, format, getMinutes, isPast } from 'date-fns';

import { cn } from '@/registry/ndeko/lib/utils';

import type { CalendarEvent, CalendarView } from './types';
import { eventChipStyle, getBorderRadiusClasses } from './utils';

const SHORT_EVENT_MINUTES = 45;

const EVENT_BLOCK = [
  'chip-3d flex size-full cursor-pointer select-none overflow-hidden px-1 text-left font-medium outline-none sm:px-2',
  'transition-[scale,filter] duration-150 ease-(--ease-out-strong) active:scale-[0.97]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
  'data-dragging:cursor-grabbing data-dragging:drop-shadow-lg data-past-event:line-through',
].join(' ');

function formatTimeWithOptionalMinutes(date: Date) {
  let pattern = 'h:mma';
  if (getMinutes(date) === 0) {
    pattern = 'ha';
  }
  return format(date, pattern).toLowerCase();
}

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

type DndProps = {
  dndListeners?: DraggableSyntheticListeners;
  dndAttributes?: DraggableAttributes;
};

type EventWrapperProps = DndProps & {
  event: CalendarEvent;
  isFirstDay?: boolean;
  isLastDay?: boolean;
  isDragging?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  className?: string;
  children: React.ReactNode;
  currentTime?: Date;
};

function EventWrapper({
  event,
  isFirstDay = true,
  isLastDay = true,
  isDragging,
  onClick,
  className,
  children,
  currentTime,
  dndListeners,
  dndAttributes,
}: EventWrapperProps) {
  const isEventInPast = isPast(shiftedEndOf(event, currentTime));

  return (
    <button
      type='button'
      className={cn(
        EVENT_BLOCK,
        getBorderRadiusClasses(isFirstDay, isLastDay),
        className
      )}
      style={eventChipStyle(event.color)}
      data-dragging={isDragging || undefined}
      data-past-event={isEventInPast || undefined}
      onClick={onClick}
      {...dndListeners}
      {...dndAttributes}
    >
      {children}
    </button>
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
  children?: React.ReactNode;
  className?: string;
};

function timeRangeLabelOf(start: Date, end: Date) {
  const startLabel = formatTimeWithOptionalMinutes(start);
  const endLabel = formatTimeWithOptionalMinutes(end);
  return `${startLabel} - ${endLabel}`;
}

function eventTimeLabelOf(event: CalendarEvent, start: Date, end: Date) {
  if (event.allDay) {
    return 'All day';
  }
  const durationMinutes = differenceInMinutes(end, start);
  if (durationMinutes < SHORT_EVENT_MINUTES) {
    return formatTimeWithOptionalMinutes(start);
  }
  return timeRangeLabelOf(start, end);
}

function MonthEventLabel({
  event,
  start,
}: {
  event: CalendarEvent;
  start: Date;
}) {
  const isTimed = !event.allDay;

  return (
    <span className='truncate'>
      {isTimed && (
        <span className='truncate font-normal opacity-70 sm:text-[11px]'>
          {formatTimeWithOptionalMinutes(start)}{' '}
        </span>
      )}
      {event.title}
    </span>
  );
}

function AgendaEventItem({
  event,
  onClick,
  className,
  dndListeners,
  dndAttributes,
}: EventItemProps) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const isEventInPast = isPast(end);
  const hasLocation = Boolean(event.location);
  const hasDescription = Boolean(event.description);

  return (
    <button
      type='button'
      className={cn(
        'chip-3d flex w-full cursor-pointer flex-col gap-1 rounded-lg p-2 text-left outline-none',
        'transition-[scale] duration-150 ease-(--ease-out-strong) active:scale-[0.99]',
        'focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid',
        'data-past-event:line-through data-past-event:opacity-90',
        className
      )}
      style={eventChipStyle(event.color)}
      data-past-event={isEventInPast || undefined}
      onClick={onClick}
      {...dndListeners}
      {...dndAttributes}
    >
      <span className='text-[13px] font-medium'>{event.title}</span>
      <span className='text-xs opacity-70'>
        {event.allDay && <span>All day</span>}
        {!event.allDay && (
          <span className='uppercase tabular-nums'>
            {timeRangeLabelOf(start, end)}
          </span>
        )}
        {hasLocation && (
          <>
            <span className='px-1 opacity-35'> · </span>
            <span>{event.location}</span>
          </>
        )}
      </span>
      {hasDescription && (
        <span className='my-1 text-xs opacity-90'>{event.description}</span>
      )}
    </button>
  );
}

function weekTextSizeOf(view: CalendarView) {
  if (view === 'week') {
    return 'text-[10px] sm:text-xs';
  }
  return 'text-xs';
}

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
    children,
    className,
    dndListeners,
    dndAttributes,
  } = props;
  const start = startOf(event, currentTime);
  const end = shiftedEndOf(event, currentTime);
  const isShortEvent = differenceInMinutes(end, start) < SHORT_EVENT_MINUTES;
  const sharedProps = {
    event,
    isFirstDay,
    isLastDay,
    isDragging,
    onClick,
    currentTime,
    dndListeners,
    dndAttributes,
  };

  if (view === 'month') {
    return (
      <EventWrapper
        {...sharedProps}
        className={cn(
          'mt-(--event-gap) h-(--event-height) items-center text-[10px] sm:text-xs',
          className
        )}
      >
        {children ?? <MonthEventLabel event={event} start={start} />}
      </EventWrapper>
    );
  }

  if (view === 'agenda') {
    return <AgendaEventItem {...props} />;
  }

  return (
    <EventWrapper
      {...sharedProps}
      className={cn(
        'py-1',
        isShortEvent && 'items-center',
        !isShortEvent && 'flex-col',
        weekTextSizeOf(view),
        className
      )}
    >
      {isShortEvent && (
        <span className='truncate'>
          {event.title}{' '}
          {showTime && (
            <span className='opacity-70'>
              {formatTimeWithOptionalMinutes(start)}
            </span>
          )}
        </span>
      )}
      {!isShortEvent && (
        <>
          <span className='truncate font-medium'>{event.title}</span>
          {showTime && (
            <span className='truncate font-normal tabular-nums opacity-70 sm:text-[11px]'>
              {eventTimeLabelOf(event, start, end)}
            </span>
          )}
        </>
      )}
    </EventWrapper>
  );
}
