'use client';

import {
  addHours,
  eachHourOfInterval,
  format,
  getHours,
  startOfDay,
} from 'date-fns';
import { useLayoutEffect, useRef } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { EndHour, ScrollToHour, StartHour, WeekCellsHeight } from './constants';
import { DraggableEvent } from './draggable-event';
import { DroppableCell } from './droppable-cell';
import type { CalendarEvent, TimedView } from './types';
import type { PositionedEvent } from './utils';

const QUARTERS = [0, 1, 2, 3];

/** The hour labels sit half a line above their row, so the first one stays readable. */
const HOUR_LABEL_ROOM_PX = 16;

export function hoursOfDay(day: Date) {
  const dayStart = startOfDay(day);
  return eachHourOfInterval({
    start: addHours(dayStart, StartHour),
    end: addHours(dayStart, EndHour - 1),
  });
}

type TimeGridScrollerProps = {
  label: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * The scrolling area of the week and day views. It opens on the morning, keeps the day
 * headers on top and the hours on the left, and can be scrolled from the keyboard.
 */
export function TimeGridScroller({
  label,
  className,
  children,
}: TimeGridScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const hourTop = (ScrollToHour - StartHour) * WeekCellsHeight;
    scroller.scrollTop = hourTop - HOUR_LABEL_ROOM_PX;
  }, []);

  return (
    <div
      ref={scrollerRef}
      role='region'
      aria-label={label}
      tabIndex={0}
      className={cn(
        'max-h-(--calendar-scroll-height) min-h-0 flex-1 overflow-auto outline-none',
        'focus-visible:ring-ring/25 rounded-b-xl focus-visible:ring-[3px] focus-visible:ring-inset',
        className
      )}
    >
      {children}
    </div>
  );
}

export function HourLabels({ hours }: { hours: Date[] }) {
  return (
    <>
      {hours.map((hour, index) => {
        const hasLabel = index > 0;
        return (
          <div
            key={hour.toString()}
            className='hairline-b border-border relative h-(--week-cells-height) last:border-b-0'
          >
            {hasLabel && (
              <span className='bg-card text-muted-foreground absolute -top-3 left-0 flex h-6 w-full items-center justify-end pe-2 text-[10px] tabular-nums @3xl:text-xs'>
                {format(hour, 'h a')}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}

export function CurrentTimeLine({ position }: { position: number }) {
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none absolute inset-x-0 z-20'
      style={{ top: `${position}%` }}
    >
      <div className='relative flex items-center'>
        <div className='bg-primary absolute -left-1 size-2 rounded-full' />
        <div className='bg-primary h-0.5 w-full' />
      </div>
    </div>
  );
}

type PositionedEventsProps = {
  positionedEvents: PositionedEvent[];
  view: TimedView;
  onEventClick: (event: CalendarEvent, clickEvent: React.MouseEvent) => void;
};

export function PositionedEvents({
  positionedEvents,
  view,
  onEventClick,
}: PositionedEventsProps) {
  return (
    <>
      {positionedEvents.map((positioned) => (
        <div
          key={positioned.event.id}
          className='absolute z-10 px-0.5'
          style={{
            top: `${positioned.top}px`,
            height: `${positioned.height}px`,
            left: `${positioned.left * 100}%`,
            width: `${positioned.width * 100}%`,
            zIndex: positioned.zIndex,
          }}
          onClick={(clickEvent) => clickEvent.stopPropagation()}
        >
          <div className='size-full'>
            <DraggableEvent
              event={positioned.event}
              view={view}
              onClick={(clickEvent) =>
                onEventClick(positioned.event, clickEvent)
              }
              showTime
              height={positioned.height}
            />
          </div>
        </div>
      ))}
    </>
  );
}

type QuarterSlotsProps = {
  day: Date;
  hours: Date[];
  idPrefix: string;
  onEventCreate: (startTime: Date) => void;
};

/** Four drop and click targets per hour, one for each quarter. */
export function QuarterSlots({
  day,
  hours,
  idPrefix,
  onEventCreate,
}: QuarterSlotsProps) {
  function createEventAt(hourValue: number, quarter: number) {
    const startTime = new Date(day);
    startTime.setHours(hourValue, quarter * 15);
    onEventCreate(startTime);
  }

  return (
    <>
      {hours.map((hour) => {
        const hourValue = getHours(hour);
        return (
          <div
            key={hour.toString()}
            className='hairline-b border-border relative h-(--week-cells-height) last:border-b-0'
          >
            {QUARTERS.map((quarter) => {
              const quarterHourTime = hourValue + quarter * 0.25;
              return (
                <DroppableCell
                  key={quarter}
                  id={`${idPrefix}-${day.toISOString()}-${quarterHourTime}`}
                  date={day}
                  time={quarterHourTime}
                  className='not-data-dragging:hover:bg-foreground/[0.03] absolute h-[calc(var(--week-cells-height)/4)] w-full cursor-pointer'
                  style={{
                    top: `calc(var(--week-cells-height) / 4 * ${quarter})`,
                  }}
                  onClick={() => createEventAt(hourValue, quarter)}
                />
              );
            })}
          </div>
        );
      })}
    </>
  );
}
