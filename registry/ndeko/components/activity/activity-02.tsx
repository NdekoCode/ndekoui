'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import {
  daysOf,
  kindOf,
  newestFirst,
  TASK_HISTORY,
  type ActivityDay,
  type ActivityEvent,
  type ActivityKind,
} from './_parts/activity-model';
import {
  ActorName,
  ChangeDetail,
  EventGlyph,
  sentenceOf,
} from './_parts/event-parts';
import { heightPresenceOf, RollingCount } from './_parts/motion-parts';
import { clockOf } from './_parts/time';

type FilterId = 'properties' | 'people' | 'schedule' | 'comments';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'properties', label: 'Properties' },
  { id: 'people', label: 'People' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'comments', label: 'Comments' },
];

const FILTER_OF_KIND: Record<ActivityKind, FilterId> = {
  created: 'properties',
  status: 'properties',
  priority: 'properties',
  label: 'properties',
  assignee: 'people',
  estimate: 'schedule',
  due: 'schedule',
  comment: 'comments',
};

const ALL_FILTERS = FILTERS.map((filter) => filter.id);

function filterOf(event: ActivityEvent) {
  return FILTER_OF_KIND[kindOf(event)];
}

function countOf(filter: FilterId) {
  return TASK_HISTORY.filter((event) => filterOf(event) === filter).length;
}

function toggled(active: FilterId[], filter: FilterId) {
  if (active.includes(filter)) {
    return active.filter((current) => current !== filter);
  }
  return [...active, filter];
}

function FilterChip({
  label,
  count,
  isActive,
  onToggle,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type='button'
      aria-pressed={isActive}
      onClick={onToggle}
      className={cn(
        'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground focus-visible:ring-ring/25 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-[color,background-color,scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px] active:scale-[0.97]',
        isActive &&
          'bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.08]'
      )}
    >
      {label}
      <span className='text-muted-foreground tabular-nums'>{count}</span>
    </button>
  );
}

function FeedRow({ event }: { event: ActivityEvent }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <div className='flex gap-3 py-1.5'>
        <EventGlyph kind={kindOf(event)} />
        <div className='min-w-0 flex-1 pt-0.5'>
          <p className='text-muted-foreground text-[13px] leading-5'>
            <ActorName actorId={event.actorId} /> {sentenceOf(event)}
            <time dateTime={event.at} className='ms-2 text-xs tabular-nums'>
              {clockOf(event.at)}
            </time>
          </p>
          {event.kind === 'change' && (
            <ChangeDetail change={event.change} className='mt-1' />
          )}
          {event.kind === 'comment' && (
            <p className='mt-1 text-[13px] leading-5'>{event.body}</p>
          )}
        </div>
      </div>
    </motion.li>
  );
}

function DayGroup({ day }: { day: ActivityDay }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <h4 className='text-muted-foreground pt-3 pb-1 text-xs font-medium'>
        {day.label}
      </h4>
      <ul>
        <AnimatePresence initial={false}>
          {day.events.map((event) => (
            <FeedRow key={event.id} event={event} />
          ))}
        </AnimatePresence>
      </ul>
    </motion.li>
  );
}

export default function Activity02() {
  const [active, setActive] = useState<FilterId[]>(ALL_FILTERS);
  const shouldReduceMotion = useReducedMotion();
  const shown = TASK_HISTORY.filter((event) =>
    active.includes(filterOf(event))
  );
  const days = daysOf(newestFirst(shown));
  const isEmpty = shown.length === 0;

  return (
    <section aria-label='Activity' className='w-full max-w-md'>
      <header className='flex items-baseline justify-between gap-3'>
        <h3 className='text-sm font-medium'>Activity</h3>
        <p className='text-muted-foreground text-xs'>
          <RollingCount value={shown.length} /> of {TASK_HISTORY.length} shown
        </p>
      </header>
      <div
        role='group'
        aria-label='Kinds of activity to show'
        className='mt-3 flex flex-wrap gap-1'
      >
        {FILTERS.map((filter) => (
          <FilterChip
            key={filter.id}
            label={filter.label}
            count={countOf(filter.id)}
            isActive={active.includes(filter.id)}
            onToggle={() => setActive((current) => toggled(current, filter.id))}
          />
        ))}
      </div>
      <ul className='mt-1'>
        <AnimatePresence initial={false}>
          {days.map((day) => (
            <DayGroup key={day.key} day={day} />
          ))}
        </AnimatePresence>
      </ul>
      <AnimatePresence initial={false}>
        {isEmpty && (
          <motion.div
            {...heightPresenceOf(shouldReduceMotion)}
            className='overflow-hidden'
          >
            <div className='hairline-border border-foreground/20 mt-3 flex flex-col items-center gap-2 rounded-xl border-dashed px-4 py-5 text-center'>
              <p className='text-muted-foreground text-[13px]'>
                No activity matches these filters
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setActive(ALL_FILTERS)}
              >
                Show everything
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
