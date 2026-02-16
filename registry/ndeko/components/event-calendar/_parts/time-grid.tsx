'use client';

import {
  addHours,
  eachHourOfInterval,
  format,
  getHours,
  startOfDay,
} from 'date-fns';

import { EndHour, StartHour } from './constants';
import { DraggableEvent } from './draggable-event';
import { DroppableCell } from './droppable-cell';
import type { CalendarEvent, TimedView } from './types';
import type { PositionedEvent } from './utils';

const QUARTERS = [0, 1, 2, 3];

export function hoursOfDay(day: Date) {
  const dayStart = startOfDay(day);
  return eachHourOfInterval({
    start: addHours(dayStart, StartHour),
    end: addHours(dayStart, EndHour - 1),
  });
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
              <span className='bg-card text-muted-foreground absolute -top-3 left-0 flex h-6 w-16 max-w-full items-center justify-end pe-2 text-[10px] tabular-nums sm:pe-4 sm:text-xs'>
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
                  className='absolute h-[calc(var(--week-cells-height)/4)] w-full'
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
