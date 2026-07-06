'use client';

import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { hold } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { StatusOrb, type StatusOrbTone } from '@/registry/ndeko/ui/status-orb';

import {
  DAY_EVENTS,
  DAY_HOURS,
  DAY_START_HOUR,
  type DayEvent,
  MOVED_REVIEW_START,
  NEW_EVENT,
  PLAN_NOTES,
} from './data';
import { useRestingState } from './use-resting-state';

type PlanStage = 'calm' | 'clash' | 'moved';

const HOUR_LABELS = Array.from(
  { length: DAY_HOURS },
  (_, index) => `${DAY_START_HOUR + index}:00`
);

const BLOCK =
  'absolute flex flex-col justify-center rounded-lg px-2.5 text-xs transition-[translate,opacity] duration-500 ease-(--ease-out-strong) translate-y-[calc(var(--start)*3rem+0.125rem)] h-[calc(var(--hours)*3rem-0.25rem)]';

const BLOCK_ARRIVAL =
  'starting:opacity-0 motion-safe:starting:translate-x-6 motion-safe:starting:translate-y-[calc(var(--start)*3rem+0.125rem)]';

type BlockStyle = React.CSSProperties & {
  '--start': number;
  '--hours': number;
};

function blockStyleOf(start: number, hours: number): BlockStyle {
  return { '--start': start, '--hours': hours };
}

function startOf(event: DayEvent, stage: PlanStage) {
  const isReview = event.id === 'review';
  const hasMoved = stage === 'moved';
  if (isReview && hasMoved) {
    return MOVED_REVIEW_START;
  }
  return event.start;
}

function toneOfStage(stage: PlanStage): StatusOrbTone {
  if (stage === 'clash') {
    return 'warning';
  }
  return 'success';
}

function noteOfStage(stage: PlanStage) {
  if (stage === 'clash') {
    return PLAN_NOTES.overlap;
  }
  if (stage === 'moved') {
    return PLAN_NOTES.moved;
  }
  return PLAN_NOTES.calm;
}

function isClashing(event: DayEvent, stage: PlanStage) {
  const isReview = event.id === 'review';
  return isReview && stage === 'clash';
}

function EventBlock({ event, stage }: { event: DayEvent; stage: PlanStage }) {
  const start = startOf(event, stage);
  const hasClash = isClashing(event, stage);

  return (
    <li
      style={blockStyleOf(start, event.hours)}
      className={cn(
        BLOCK,
        'bg-foreground/[0.06] inset-x-0',
        hasClash && 'bg-warning/10 text-warning-foreground'
      )}
    >
      <span className='truncate font-medium'>{event.title}</span>
      <span className='text-muted-foreground tabular-nums'>
        {event.timeLabel}
      </span>
    </li>
  );
}

function NewEventBlock() {
  return (
    <li
      style={blockStyleOf(NEW_EVENT.start, NEW_EVENT.hours)}
      className={cn(
        BLOCK,
        BLOCK_ARRIVAL,
        'bg-info/10 text-info-foreground start-6 end-0 z-10 shadow-[0_1px_2px_rgb(0_0_0/0.06)]'
      )}
    >
      <span className='truncate font-medium'>{NEW_EVENT.title}</span>
      <span className='tabular-nums'>{NEW_EVENT.timeLabel}</span>
    </li>
  );
}

const STEPS_DELAYS = { clash: 1500, moved: 1900 };

export function PlanDemo() {
  const [stage, setStage] = useState<PlanStage>('calm');
  const steps = [
    { after: STEPS_DELAYS.clash, run: () => setStage('clash') },
    { after: STEPS_DELAYS.moved, run: () => setStage('moved') },
    { after: 3600, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 1200,
    onReset: () => setStage('calm'),
  });
  useRestingState<PlanStage>(!isAutoplaying, 'moved', setStage);
  const hasNewEvent = stage !== 'calm';
  const note = noteOfStage(stage);
  const tone = toneOfStage(stage);
  const hasClash = stage === 'clash';

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      role='img'
      aria-label='A sample day where a new event lands on top of another one and Murmura moves the one that can move'
      className='bg-card hairline-ring ring-border flex w-full max-w-sm flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.12)]'
    >
      <div className='flex items-center justify-between gap-3 px-1 pt-1'>
        <p className='text-muted-foreground text-xs font-medium'>Thursday</p>
        {hasClash && <Chip color='var(--warning)'>Overlap</Chip>}
      </div>
      <div className='flex gap-3'>
        <ol className='text-muted-foreground flex w-9 shrink-0 flex-col text-xs tabular-nums'>
          {HOUR_LABELS.map((label) => (
            <li key={label} className='h-12'>
              {label}
            </li>
          ))}
        </ol>
        <ul
          style={{ height: `${DAY_HOURS * 3}rem` }}
          className='relative min-w-0 flex-1'
        >
          {DAY_EVENTS.map((event) => (
            <EventBlock key={event.id} event={event} stage={stage} />
          ))}
          {hasNewEvent && <NewEventBlock />}
        </ul>
      </div>
      <p className='bg-foreground/[0.04] flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px]'>
        <StatusOrb tone={tone} size='sm' />
        <Swap swapKey={note} className='min-w-0 text-start'>
          {note}
        </Swap>
      </p>
    </div>
  );
}
