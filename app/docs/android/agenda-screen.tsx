'use client';

import { useState } from 'react';

import { Chip } from '@/registry/ndeko/ui/chip';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type Day = {
  id: DayId;
  letter: string;
  date: number;
  name: string;
};

type AgendaEvent = {
  id: string;
  start: string;
  duration: string;
  title: string;
  place: string;
  isNow?: boolean;
};

const DAYS: Day[] = [
  { id: 'mon', letter: 'M', date: 2, name: 'Monday' },
  { id: 'tue', letter: 'T', date: 3, name: 'Tuesday' },
  { id: 'wed', letter: 'W', date: 4, name: 'Wednesday' },
  { id: 'thu', letter: 'T', date: 5, name: 'Thursday' },
  { id: 'fri', letter: 'F', date: 6, name: 'Friday' },
  { id: 'sat', letter: 'S', date: 7, name: 'Saturday' },
  { id: 'sun', letter: 'S', date: 8, name: 'Sunday' },
];

const TODAY: DayId = 'thu';

const EVENTS: Record<DayId, AgendaEvent[]> = {
  mon: [
    {
      id: 'week-planning',
      start: '10:00',
      duration: '1 h',
      title: 'Week planning',
      place: 'Room 2',
    },
  ],
  tue: [],
  wed: [
    {
      id: 'hiring-sync',
      start: '10:00',
      duration: '30 min',
      title: 'Hiring sync',
      place: 'Video call',
    },
    {
      id: 'roadmap',
      start: '14:00',
      duration: '1 h 30',
      title: 'Roadmap planning',
      place: 'Room 4',
    },
  ],
  thu: [
    {
      id: 'standup',
      start: '9:30',
      duration: '15 min',
      title: 'Standup',
      place: 'Video call',
      isNow: true,
    },
    {
      id: 'design-review',
      start: '11:00',
      duration: '1 h',
      title: 'Design review',
      place: 'Room 2',
    },
    {
      id: 'lunch',
      start: '13:00',
      duration: '1 h',
      title: 'Lunch with Ines Laurent',
      place: 'Ground floor café',
    },
    {
      id: 'sprint-review',
      start: '15:30',
      duration: '1 h',
      title: 'Sprint review',
      place: 'Room 4',
    },
  ],
  fri: [
    {
      id: 'standup-friday',
      start: '9:30',
      duration: '15 min',
      title: 'Standup',
      place: 'Video call',
    },
    {
      id: 'retro',
      start: '16:00',
      duration: '1 h',
      title: 'Team retro',
      place: 'Room 2',
    },
  ],
  sat: [],
  sun: [],
};

function isDayId(value: string | undefined): value is DayId {
  return DAYS.some((day) => day.id === value);
}

function dayOf(id: DayId) {
  const match = DAYS.find((day) => day.id === id);
  return match ?? DAYS[0];
}

function countLabelOf(count: number) {
  if (count === 1) {
    return '1 event';
  }
  return `${count} events`;
}

function EventRow({ event }: { event: AgendaEvent }) {
  return (
    <li className='flex gap-3'>
      <span className='text-muted-foreground w-9 shrink-0 pt-2.5 text-xs tabular-nums'>
        {event.start}
      </span>
      <div className='bg-card hairline-ring ring-border flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl px-3 py-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <span className='flex items-center justify-between gap-2'>
          <span className='truncate text-sm font-medium'>{event.title}</span>
          {event.isNow && <Chip>Now</Chip>}
        </span>
        <span className='text-muted-foreground truncate text-xs'>
          {event.duration} · {event.place}
        </span>
      </div>
    </li>
  );
}

function NothingPlanned() {
  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-1 py-10 text-center'>
      <span className='text-sm font-medium'>Nothing planned</span>
      <span className='text-muted-foreground text-xs'>
        Pick another day to see its events
      </span>
    </div>
  );
}

export function AgendaScreen() {
  const [dayId, setDayId] = useState<DayId>(TODAY);
  const day = dayOf(dayId);
  const events = EVENTS[dayId];
  const countLabel = countLabelOf(events.length);
  const hasEvents = events.length > 0;

  function selectDay(values: string[]) {
    const [next] = values;
    if (!isDayId(next)) {
      return;
    }
    setDayId(next);
  }

  return (
    <div className='flex flex-1 flex-col gap-4 px-4 pt-3 pb-4'>
      <div className='flex flex-col gap-0.5'>
        <span className='text-muted-foreground text-xs'>November 2026</span>
        <p className='text-2xl font-semibold'>Agenda</p>
      </div>
      <ToggleGroup
        travel
        aria-label='Day'
        value={[dayId]}
        onValueChange={selectDay}
        indicatorClassName='bg-primary'
        className='w-full justify-between'
      >
        {DAYS.map((option) => (
          <ToggleGroupItem
            key={option.id}
            value={option.id}
            aria-label={`${option.name} ${option.date}`}
            className='data-pressed:text-primary-foreground h-12 min-w-0 flex-1 flex-col gap-0.5 rounded-full px-0'
          >
            <span className='text-[11px] leading-none'>{option.letter}</span>
            <span className='text-sm leading-none tabular-nums'>
              {option.date}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className='flex items-baseline justify-between gap-2'>
        <span className='text-sm font-medium'>
          {day.name} {day.date}
        </span>
        <span className='text-muted-foreground text-xs'>{countLabel}</span>
      </div>
      {hasEvents && (
        <ul className='flex flex-col gap-2'>
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
      {!hasEvents && <NothingPlanned />}
    </div>
  );
}
