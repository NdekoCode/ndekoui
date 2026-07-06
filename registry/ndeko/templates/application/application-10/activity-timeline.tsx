'use client';

import { useId, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { elapsedOf, formatDuration } from '@/registry/ndeko/lib/agent-run';
import {
  BrainIcon,
  ChevronDownIcon,
  CompassIcon,
  FileTextIcon,
  SearchIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';

import { seedOf, type ActivityKind, type ActivitySeed } from './data';
import type { ActivityRun } from './session';

const KIND_WORD: Record<ActivityKind, string> = {
  think: 'Think',
  search: 'Search',
  read: 'Read',
};

const KIND_ICON: Record<ActivityKind, Icon> = {
  think: BrainIcon,
  search: SearchIcon,
  read: FileTextIcon,
};

function KindTile({ seed }: { seed: ActivitySeed }) {
  if (seed.brand) {
    return <BrandTile brand={seed.brand} size='lg' title={seed.product} />;
  }
  const KindIcon = KIND_ICON[seed.kind];

  return (
    <span
      aria-hidden='true'
      className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'
    >
      <KindIcon className='size-3.5' />
    </span>
  );
}

function sublineOf(seed: ActivitySeed, run: ActivityRun) {
  if (run.status === 'done') {
    return seed.doneSummary;
  }
  return seed.detail;
}

type ActivityRowProps = {
  run: ActivityRun;
  isLast: boolean;
};

function ActivityRow({ run, isLast }: ActivityRowProps) {
  const seed = seedOf(run.id);
  const isRunning = run.status === 'running';
  const subline = sublineOf(seed, run);

  return (
    <li className='relative flex gap-2.5 pb-3 transition-[opacity,translate] duration-300 ease-(--ease-out-strong) last:pb-0 starting:translate-y-1 starting:opacity-0'>
      {!isLast && (
        <span
          aria-hidden='true'
          className='bg-border absolute start-3.5 top-8 bottom-1 w-px'
        />
      )}
      <KindTile seed={seed} />
      <div className='flex min-w-0 flex-1 flex-col'>
        <p className='flex h-7 items-center gap-2 text-[13px]'>
          <span className='min-w-0 truncate font-medium'>{seed.title}</span>
          <CallStatusMark status={run.status} />
          <LiveDuration
            item={run}
            isRunning={isRunning}
            className='text-muted-foreground ms-auto w-10 shrink-0 text-end text-xs'
          />
        </p>
        <p className='text-muted-foreground min-h-5 text-xs leading-5'>
          <span className='text-foreground/70'>{KIND_WORD[seed.kind]}</span>
          <span aria-hidden='true'> · </span>
          <span
            key={run.status}
            className='transition-opacity duration-300 starting:opacity-0'
          >
            {subline}
          </span>
        </p>
      </div>
    </li>
  );
}

function headlineOf(isResearching: boolean, duration: string) {
  if (isResearching) {
    return 'Researching';
  }
  return `Researched in ${duration}`;
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

type ActivityTimelineProps = {
  activity: ActivityRun[];
  isResearching: boolean;
  startedAt?: number;
  endedAt?: number;
};

/** Open while the agent works, then folded into one line that says how long the research took. */
export function ActivityTimeline({
  activity,
  isResearching,
  startedAt,
  endedAt,
}: ActivityTimelineProps) {
  const [openChoice, setOpenChoice] = useState<boolean | null>(null);
  const [wasResearching, setWasResearching] = useState(isResearching);
  const panelId = useId();
  const span = { startedAt, endedAt };
  const elapsed = elapsedOf(span, endedAt ?? 0);
  const duration = formatDuration(elapsed);
  const headline = headlineOf(isResearching, duration);
  const lastIndex = activity.length - 1;

  if (wasResearching !== isResearching) {
    setWasResearching(isResearching);
    setOpenChoice(null);
  }

  const isOpen = openChoice ?? isResearching;

  function toggle() {
    setOpenChoice(!isOpen);
  }

  return (
    <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] rounded-xl p-1.5'>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={toggle}
        className='hover:bg-foreground/[0.04] focus-visible:ring-ring/25 flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-start text-[13px] outline-none focus-visible:ring-[3px]'
      >
        <CompassIcon className='text-muted-foreground size-4 shrink-0' />
        <span className='min-w-0 truncate font-medium'>
          <WordRoll text={headline} />
        </span>
        {isResearching && (
          <LiveDuration
            item={span}
            isRunning
            className='text-muted-foreground w-10 text-xs'
          />
        )}
        <span className='text-muted-foreground ms-auto shrink-0 text-xs tabular-nums'>
          {countOf(activity.length, 'step')}
        </span>
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground size-3.5 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(isOpen)
          )}
        />
      </button>
      <Fold open={isOpen} id={panelId}>
        <ol
          aria-label='Research steps'
          className='flex flex-col px-2 pt-2 pb-1.5'
        >
          {activity.map((run, index) => (
            <ActivityRow key={run.id} run={run} isLast={index === lastIndex} />
          ))}
        </ol>
      </Fold>
    </div>
  );
}
