'use client';

import { useId, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

import { memberById, type Member } from './_parts/people';
import { Segments, type Segment } from './_parts/segments';
import { SlidingCount } from './_parts/sliding-count';

type Week = 'this' | 'next';

type Load = {
  memberId: string;
  capacityHours: number;
  plannedHours: Record<Week, number>;
};

const WEEK_SEGMENTS: Segment<Week>[] = [
  { value: 'this', label: 'This week' },
  { value: 'next', label: 'Next week' },
];

const LOADS: Load[] = [
  {
    memberId: 'amara',
    capacityHours: 40,
    plannedHours: { this: 34, next: 30 },
  },
  { memberId: 'leo', capacityHours: 40, plannedHours: { this: 38, next: 42 } },
  { memberId: 'sana', capacityHours: 40, plannedHours: { this: 44, next: 36 } },
  {
    memberId: 'tomas',
    capacityHours: 32,
    plannedHours: { this: 22, next: 28 },
  },
  { memberId: 'mei', capacityHours: 20, plannedHours: { this: 12, next: 18 } },
];

function hoursOf(hours: number) {
  return `${hours}h`;
}

function shareOf(planned: number, capacity: number) {
  const share = planned / capacity;
  return Math.min(1, share);
}

function isOverOf(planned: number, capacity: number) {
  return planned > capacity;
}

function totalOf(values: number[]) {
  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total;
}

function loadLabelOf(member: Member, planned: number, capacity: number) {
  const isOver = isOverOf(planned, capacity);
  if (isOver) {
    return `${member.name}: ${planned} of ${capacity} hours planned, over capacity`;
  }
  return `${member.name}: ${planned} of ${capacity} hours planned`;
}

function LoadRow({ load, week }: { load: Load; week: Week }) {
  const member = memberById(load.memberId);
  const planned = load.plannedHours[week];
  const share = shareOf(planned, load.capacityHours);
  const isOver = isOverOf(planned, load.capacityHours);
  const fillStyle = { transform: `scaleX(${share})` };
  const label = loadLabelOf(member, planned, load.capacityHours);

  return (
    <li className='grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_4.5rem] items-center gap-3 py-2'>
      <span className='flex min-w-0 items-center gap-2.5'>
        <Avatar className='size-7 text-[10px]'>
          {member.avatar && <AvatarImage src={member.avatar} alt='' />}
          <AvatarFallback>{member.initials}</AvatarFallback>
        </Avatar>
        <span className='min-w-0'>
          <span className='block truncate text-[13px] leading-5 font-medium'>
            {member.name}
          </span>
          <span className='text-muted-foreground block truncate text-xs'>
            {member.title}
          </span>
        </span>
      </span>
      <span
        role='img'
        aria-label={label}
        className='bg-foreground/[0.06] block h-1.5 overflow-hidden rounded-full'
      >
        <span
          style={fillStyle}
          className={cn(
            'block h-full origin-left rounded-full transition-[transform,background-color] duration-300 ease-(--ease-out-strong)',
            isOver && 'bg-warning',
            !isOver && 'bg-primary'
          )}
        />
      </span>
      <span
        aria-hidden='true'
        className='flex justify-end text-[13px] tabular-nums'
      >
        <SlidingCount
          value={planned}
          format={hoursOf}
          className={cn(
            'font-medium transition-colors duration-300',
            isOver && 'text-warning-foreground'
          )}
        />
        <span className='text-muted-foreground'>
          &nbsp;/ {load.capacityHours}h
        </span>
      </span>
    </li>
  );
}

export default function Teams08() {
  const titleId = useId();
  const [week, setWeek] = useState<Week>('this');
  const planned = LOADS.map((load) => load.plannedHours[week]);
  const capacities = LOADS.map((load) => load.capacityHours);
  const totalPlanned = totalOf(planned);
  const totalCapacity = totalOf(capacities);

  return (
    <section
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border w-full max-w-[34rem] rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h3 id={titleId} className='text-sm font-medium'>
            Workload
          </h3>
          <p className='text-muted-foreground text-xs'>
            Planned hours against each capacity · Illustrative
          </p>
        </div>
        <Segments
          value={week}
          segments={WEEK_SEGMENTS}
          onValueChange={setWeek}
          label='Week'
        />
      </header>
      <ul aria-label='Members' className='mt-3'>
        {LOADS.map((load) => (
          <LoadRow key={load.memberId} load={load} week={week} />
        ))}
      </ul>
      <p className='text-muted-foreground mt-2 flex items-center justify-end gap-1 text-xs'>
        Team
        <SlidingCount
          value={totalPlanned}
          format={hoursOf}
          className='text-foreground font-medium'
        />
        planned of {totalCapacity}h
      </p>
    </section>
  );
}
