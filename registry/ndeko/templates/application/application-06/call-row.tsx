'use client';

import { useId, useState } from 'react';

import { elapsedOf, formatDuration } from '@/registry/ndeko/lib/agent-run';
import {
  ChevronDownIcon,
  MinusIcon,
  WandIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';

import { stepSeedOf, type StepKind, type StepSeed } from './data';
import type { StepRun, StepStatus } from './session';

const KIND_WORD: Record<StepKind, string> = {
  tool: 'Tool',
  skill: 'Skill',
};

function StepTile({ seed }: { seed: StepSeed }) {
  if (seed.brand) {
    return <BrandTile brand={seed.brand} size='lg' title={seed.product} />;
  }

  return (
    <span
      aria-hidden='true'
      className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'
    >
      <WandIcon className='size-3.5' />
    </span>
  );
}

function StepMark({ status }: { status: StepStatus }) {
  if (status === 'skipped') {
    return (
      <span className='inline-flex size-4 shrink-0 items-center justify-center'>
        <MinusIcon className='text-muted-foreground size-4' />
        <span className='sr-only'>Not run</span>
      </span>
    );
  }
  return <CallStatusMark status={status} />;
}

function StepClock({ run }: { run: StepRun }) {
  if (run.status === 'running') {
    return (
      <LiveDuration
        item={run}
        isRunning
        className='text-muted-foreground w-10 shrink-0 text-end text-xs'
      />
    );
  }
  if (run.status === 'done') {
    const elapsed = elapsedOf(run, run.endedAt ?? 0);
    return (
      <span className='text-muted-foreground w-10 shrink-0 text-end text-xs tabular-nums'>
        {formatDuration(elapsed)}
      </span>
    );
  }
  return null;
}

function sublineOf(seed: StepSeed, status: StepStatus) {
  if (status === 'done') {
    return seed.doneSummary;
  }
  if (status === 'skipped') {
    return 'Nothing was sent';
  }
  return seed.detail;
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

type CallRowProps = {
  run: StepRun;
  isLast: boolean;
  children?: React.ReactNode;
};

export function CallRow({ run, isLast, children }: CallRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const detailsId = useId();
  const seed = stepSeedOf(run.id);

  function toggle() {
    setIsOpen((current) => !current);
  }

  return (
    <li className='relative flex gap-2.5 pb-3 transition-[opacity,translate] duration-300 ease-(--ease-out-strong) last:pb-0 starting:translate-y-1 starting:opacity-0'>
      {!isLast && (
        <span
          aria-hidden='true'
          className='bg-border absolute start-3.5 top-8 bottom-1 w-px'
        />
      )}
      <StepTile seed={seed} />
      <div className='flex min-w-0 flex-1 flex-col'>
        <button
          type='button'
          aria-expanded={isOpen}
          aria-controls={detailsId}
          onClick={toggle}
          className='hover:bg-foreground/[0.04] focus-visible:ring-ring/25 -mx-1.5 flex cursor-pointer flex-col rounded-md px-1.5 text-start outline-none focus-visible:ring-[3px]'
        >
          <span className='flex h-7 items-center gap-2 text-[13px]'>
            <span className='min-w-0 truncate font-medium'>{seed.title}</span>
            <StepMark status={run.status} />
            <StepClock run={run} />
            <ChevronDownIcon
              className={cn(
                'text-muted-foreground size-3.5 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
                chevronTurnOf(isOpen)
              )}
            />
          </span>
          <span className='text-muted-foreground min-h-5 text-xs leading-5'>
            <span className='text-foreground/70'>{KIND_WORD[seed.kind]}</span>
            <span aria-hidden='true'> · </span>
            <span
              key={run.status}
              className='transition-opacity duration-300 starting:opacity-0'
            >
              {sublineOf(seed, run.status)}
            </span>
          </span>
        </button>
        <Fold open={isOpen} id={detailsId}>
          <dl className='bg-foreground/[0.03] dark:bg-foreground/[0.05] mt-1.5 flex flex-col gap-1 rounded-lg p-2.5 font-mono text-xs leading-relaxed'>
            <div className='flex gap-1.5'>
              <dt className='text-muted-foreground shrink-0'>Input</dt>
              <dd className='min-w-0 break-words'>{seed.input}</dd>
            </div>
            <div className='flex gap-1.5'>
              <dt className='text-muted-foreground shrink-0'>Result</dt>
              <dd className='min-w-0 break-words'>{seed.output}</dd>
            </div>
          </dl>
        </Fold>
        {children}
      </div>
    </li>
  );
}
