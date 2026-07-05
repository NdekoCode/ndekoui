'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';

import {
  ACTIVITY,
  CODER,
  DIFF_STATS,
  ISSUE,
  PLAN_STEPS,
  REVIEWER,
  type Activity,
} from './data';
import type { PlanDecision, PlanStatus } from './session';

export function CoderTile() {
  const gemStyle = {
    '--gem': seriesColorOf(CODER.series),
  } as React.CSSProperties;

  return (
    <span
      aria-hidden='true'
      style={gemStyle}
      className='gem-plate inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold select-none'
    >
      {CODER.initial}
    </span>
  );
}

function ActorMark({ actor }: { actor: Activity['actor'] }) {
  if (actor === 'coder') {
    return <CoderTile />;
  }
  return (
    <Avatar className='size-6'>
      <AvatarImage src={REVIEWER.avatar} alt='' />
      <AvatarFallback className='text-[9px]'>
        {REVIEWER.initials}
      </AvatarFallback>
    </Avatar>
  );
}

function actorNameOf(actor: Activity['actor']) {
  if (actor === 'coder') {
    return CODER.name;
  }
  return REVIEWER.name;
}

function pressedSolidOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-primary/85';
  }
  return undefined;
}

type PlanBodyProps = {
  plan: PlanStatus;
  pressed: string | null;
  onDecide: (decision: PlanDecision) => void;
};

function PlanBody({ plan, pressed, onDecide }: PlanBodyProps) {
  const isPending = plan === 'pending';

  return (
    <div className='bg-foreground/[0.04] mt-2 flex flex-col gap-1 rounded-lg p-3'>
      <ol className='flex flex-col gap-1.5 text-[13px]'>
        {PLAN_STEPS.map((step, index) => (
          <li key={step} className='flex gap-2.5'>
            <span className='text-muted-foreground w-3 shrink-0 tabular-nums'>
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <Fold open={isPending}>
        <div className='flex flex-wrap items-center gap-2 pt-2'>
          <Button
            type='button'
            size='sm'
            onClick={() => onDecide('approved')}
            className={pressedSolidOf(pressed === 'approve')}
          >
            Approve the plan
          </Button>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() => onDecide('changes')}
          >
            Ask for changes
          </Button>
          <span className='text-muted-foreground text-xs'>
            Nothing is written before you approve
          </span>
        </div>
      </Fold>
    </div>
  );
}

function DiffBar() {
  const total = DIFF_STATS.additions + DIFF_STATS.deletions;
  const addedShare = DIFF_STATS.additions / total;
  const addedStyle = { transform: `scaleX(${addedShare})` };

  return (
    <span
      aria-hidden='true'
      className='bg-destructive/50 relative h-1.5 w-16 overflow-hidden rounded-full'
    >
      <span
        style={addedStyle}
        className='bg-success absolute inset-0 origin-left'
      />
    </span>
  );
}

function PullRequestBody() {
  return (
    <div className='bg-foreground/[0.04] mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg p-3'>
      <BrandTile brand='github' size='lg' title='GitHub' />
      <span className='min-w-40 flex-1 text-[13px] font-medium'>
        {ISSUE.pullRequest}
      </span>
      <span className='flex items-center gap-2 text-xs tabular-nums'>
        <span className='text-success-foreground'>+{DIFF_STATS.additions}</span>
        <span className='text-destructive-ink'>-{DIFF_STATS.deletions}</span>
        <DiffBar />
        <span className='text-muted-foreground'>{DIFF_STATS.files} files</span>
      </span>
    </div>
  );
}

function EntryText({ entry }: { entry: Activity }) {
  const name = actorNameOf(entry.actor);

  if (entry.kind === 'commit') {
    return (
      <p className='text-[13px] leading-6'>
        <span className='font-medium'>{name}</span>{' '}
        <span className='text-muted-foreground'>pushed</span>{' '}
        <code className='bg-foreground/[0.05] rounded-sm px-1 py-0.5 font-mono text-xs'>
          {entry.hash}
        </code>{' '}
        {entry.text}
      </p>
    );
  }
  return (
    <p className='text-[13px] leading-6'>
      <span className='font-medium'>{name}</span>{' '}
      <span className='text-muted-foreground'>{entry.text}</span>
    </p>
  );
}

type TimelineProps = PlanBodyProps & {
  events: string[];
};

export function Timeline({ events, plan, pressed, onDecide }: TimelineProps) {
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const lastId = events.at(-1);

  return (
    <ol aria-label='Activity' className='flex flex-col'>
      <AnimatePresence initial={false}>
        {events.map((id) => {
          const entry = ACTIVITY[id];
          const isLast = id === lastId;
          return (
            <motion.li key={id} className='overflow-hidden' {...rowPresence}>
              <div className='relative flex gap-3 pb-4'>
                {!isLast && (
                  <span
                    aria-hidden='true'
                    className='bg-border absolute top-7 bottom-1 left-3 w-px'
                  />
                )}
                <ActorMark actor={entry.actor} />
                <div className='min-w-0 flex-1'>
                  <EntryText entry={entry} />
                  {entry.kind === 'plan' && (
                    <PlanBody
                      plan={plan}
                      pressed={pressed}
                      onDecide={onDecide}
                    />
                  )}
                  {entry.kind === 'pull-request' && <PullRequestBody />}
                </div>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}
