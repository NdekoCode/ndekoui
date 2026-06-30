'use client';

import { isPast } from 'date-fns';

import { cn } from '@/registry/ndeko/lib/utils';

import type { CalendarEvent } from './types';
import { eventChipStyle, timeLabelOnDay } from './utils';

const ROW = [
  'flex w-full cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-left text-[13px] outline-none',
  'transition-colors duration-150 hover:bg-foreground/[0.04]',
  'focus-visible:ring-[3px] focus-visible:ring-ring/25',
  'data-past-event:opacity-60',
].join(' ');

type EventListRowProps = {
  event: CalendarEvent;
  /** The day the row is listed under, so a multi-day event says when it runs that day. */
  day: Date;
  onClick?: (clickEvent: React.MouseEvent) => void;
  className?: string;
};

/** One event in a list: its colour, when it runs that day, its title and its place. */
export function EventListRow({
  event,
  day,
  onClick,
  className,
}: EventListRowProps) {
  const end = new Date(event.end);
  const isEventInPast = isPast(end);
  const hasLocation = Boolean(event.location);

  return (
    <button
      type='button'
      className={cn(ROW, className)}
      style={eventChipStyle(event.color)}
      data-past-event={isEventInPast || undefined}
      onClick={onClick}
    >
      <span
        aria-hidden='true'
        className='mt-[5px] size-2 shrink-0 rounded-full bg-(--chip)'
      />
      <span className='text-muted-foreground w-20 shrink-0 tabular-nums @2xl:w-32'>
        {timeLabelOnDay(event, day)}
      </span>
      <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='truncate font-medium'>{event.title}</span>
        {hasLocation && (
          <span className='text-muted-foreground truncate text-xs'>
            {event.location}
          </span>
        )}
      </span>
    </button>
  );
}
