'use client';

import { differenceInMinutes, parseISO } from 'date-fns';
import { useId, useState } from 'react';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

import type { ActivityChange } from './_parts/activity-model';
import { ChangeDetail, EventGlyph, verbOf } from './_parts/event-parts';
import { PersonAvatar } from './_parts/glyphs';
import { Swap } from './_parts/motion-parts';
import { actorNameOf, personOf } from './_parts/people';
import { clockOf, countLabel } from './_parts/time';

type ChangeEvent = {
  id: string;
  actorId: string;
  at: string;
  change: ActivityChange;
};

type ChangeRun = {
  id: string;
  actorId: string;
  events: ChangeEvent[];
};

const RUN_WINDOW_MINUTES = 30;

const MORNING: ChangeEvent[] = [
  {
    id: 'm1',
    actorId: 'leo',
    at: '2026-11-05T09:31:00',
    change: { field: 'estimate', from: 240, to: 360 },
  },
  {
    id: 'm2',
    actorId: 'leo',
    at: '2026-11-05T09:32:00',
    change: { field: 'due', from: '2026-11-06', to: '2026-11-07' },
  },
  {
    id: 'm3',
    actorId: 'leo',
    at: '2026-11-05T09:36:00',
    change: { field: 'priority', from: 'medium', to: 'high' },
  },
  {
    id: 'm4',
    actorId: 'leo',
    at: '2026-11-05T09:40:00',
    change: { field: 'label', to: 'reports' },
  },
  {
    id: 'm5',
    actorId: 'mei',
    at: '2026-11-05T10:05:00',
    change: { field: 'assignee', to: 'tomas' },
  },
  {
    id: 'm6',
    actorId: 'tomas',
    at: '2026-11-05T10:20:00',
    change: { field: 'status', from: 'in_progress', to: 'in_review' },
  },
  {
    id: 'm7',
    actorId: 'tomas',
    at: '2026-11-05T10:22:00',
    change: { field: 'estimate', from: 360, to: 300 },
  },
];

function belongsToRun(run: ChangeRun | undefined, event: ChangeEvent) {
  if (!run) {
    return false;
  }
  const last = run.events[run.events.length - 1];
  const isSameActor = last.actorId === event.actorId;
  const gap = differenceInMinutes(parseISO(event.at), parseISO(last.at));
  const isClose = gap <= RUN_WINDOW_MINUTES;
  return isSameActor && isClose;
}

function runsOf(events: ChangeEvent[]) {
  const runs: ChangeRun[] = [];
  for (const event of events) {
    const last = runs.at(-1);
    if (last && belongsToRun(last, event)) {
      last.events.push(event);
      continue;
    }
    runs.push({ id: event.id, actorId: event.actorId, events: [event] });
  }
  return runs;
}

function foldLabelOf(hiddenCount: number, isOpen: boolean) {
  if (isOpen) {
    return 'Show fewer';
  }
  return `Show ${countLabel(hiddenCount, 'more change', 'more changes')}`;
}

function runSentenceOf(run: ChangeRun) {
  const count = run.events.length;
  if (count === 1) {
    return verbOf(run.events[0].change);
  }
  return `made ${countLabel(count, 'change', 'changes')}`;
}

function ChangeLine({ event }: { event: ChangeEvent }) {
  return (
    <li className='flex items-center gap-2.5 py-1'>
      <EventGlyph kind={event.change.field} className='size-5' />
      <span className='text-muted-foreground shrink-0 text-xs'>
        {verbOf(event.change)}
      </span>
      <ChangeDetail change={event.change} className='min-w-0' />
      <time
        dateTime={event.at}
        className='text-muted-foreground ms-auto shrink-0 text-xs tabular-nums'
      >
        {clockOf(event.at)}
      </time>
    </li>
  );
}

function RunBlock({ run }: { run: ChangeRun }) {
  const [isOpen, setIsOpen] = useState(false);
  const listId = useId();
  const [first, ...rest] = run.events;
  const hiddenCount = rest.length;
  const hasFold = hiddenCount > 0;
  const label = foldLabelOf(hiddenCount, isOpen);

  return (
    <li className='flex gap-3 py-2.5'>
      <PersonAvatar
        person={personOf(run.actorId)}
        className='size-7 text-[10px]'
      />
      <div className='min-w-0 flex-1'>
        <p className='text-muted-foreground text-[13px] leading-5'>
          <span className='text-foreground font-medium'>
            {actorNameOf(run.actorId)}
          </span>{' '}
          {runSentenceOf(run)}
        </p>
        <AnimatedSize className='mt-1'>
          <ul id={listId}>
            <ChangeLine event={first} />
            {isOpen &&
              rest.map((event) => <ChangeLine key={event.id} event={event} />)}
          </ul>
        </AnimatedSize>
        {hasFold && (
          <button
            type='button'
            aria-expanded={isOpen}
            aria-controls={listId}
            onClick={() => setIsOpen((current) => !current)}
            className='text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] focus-visible:ring-ring/25 -ms-1.5 mt-1 inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-[3px]'
          >
            <ChevronDownIcon
              className={cn(
                'size-3.5 transition-transform duration-200 ease-(--ease-out-strong)',
                isOpen && 'rotate-180'
              )}
            />
            <AnimatedSize as='span' axis='width'>
              <Swap swapKey={label}>{label}</Swap>
            </AnimatedSize>
          </button>
        )}
      </div>
    </li>
  );
}

export default function Activity06() {
  const runs = runsOf(MORNING);

  return (
    <section aria-label='This morning' className='w-full max-w-md'>
      <header className='flex items-baseline justify-between gap-3'>
        <h3 className='text-sm font-medium'>This morning</h3>
        <p className='text-muted-foreground text-xs'>
          {countLabel(MORNING.length, 'change', 'changes')}, grouped by person
        </p>
      </header>
      <ol className='mt-1'>
        {runs.map((run) => (
          <RunBlock key={run.id} run={run} />
        ))}
      </ol>
    </section>
  );
}
