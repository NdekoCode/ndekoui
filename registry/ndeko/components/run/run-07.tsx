'use client';

import { useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import {
  ArrowUpIcon,
  CheckIcon,
  RotateCcwIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import {
  compactionLineOf,
  freeTokensOf,
  LEVEL_LABELS,
  LEVEL_TONE,
  LEVEL_WORD,
  levelOf,
  PART_FILL,
  RESERVE_STYLE,
  shareOf,
  TURNS,
  usedTokensOf,
  type Compaction,
  type ContextBudget,
} from './_parts/context';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { TokenCount } from './_parts/token-count';
import {
  useContextControls,
  type CompactStatus,
} from './_parts/use-context-demo';

const RING_SIZE = 28;

const RING_STROKE = 3;

const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;

const RING_CENTER = RING_SIZE / 2;

const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const WARNING_FROM = 0.85;

const COMPACT_LABELS: Record<MorphState, string> = {
  idle: 'Compact older turns',
  busy: 'Compacting',
  done: 'Compacted',
};

function percentLabelOf(share: number) {
  const percent = Math.round(share * 100);
  return `${percent}%`;
}

function dashOffsetOf(share: number) {
  const bounded = Math.min(1, Math.max(0, share));
  const remaining = 1 - bounded;
  return CIRCUMFERENCE * remaining;
}

function ringToneOf(isWarning: boolean) {
  if (isWarning) {
    return {
      trigger: 'bg-warning/10 hover:bg-warning/15',
      track: 'stroke-warning/25',
      fill: 'stroke-warning',
    };
  }
  return {
    trigger: 'hover:bg-foreground/5',
    track: 'stroke-foreground/10',
    fill: 'stroke-chart-1',
  };
}

function morphStateOf(status: CompactStatus): MorphState {
  if (status === 'compacting') {
    return 'busy';
  }
  return 'idle';
}

function traceOf(compaction: Compaction | null, isCompactShown: boolean) {
  if (isCompactShown) {
    return null;
  }
  return compaction;
}

function RingGlyph({
  share,
  isWarning,
}: {
  share: number;
  isWarning: boolean;
}) {
  const tone = ringToneOf(isWarning);
  const dashOffset = dashOffsetOf(share);

  return (
    <svg
      aria-hidden='true'
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className='-rotate-90'
    >
      <circle
        cx={RING_CENTER}
        cy={RING_CENTER}
        r={RING_RADIUS}
        fill='none'
        strokeWidth={RING_STROKE}
        className={cn('transition-[stroke] duration-300', tone.track)}
      />
      <circle
        cx={RING_CENTER}
        cy={RING_CENTER}
        r={RING_RADIUS}
        fill='none'
        strokeWidth={RING_STROKE}
        strokeLinecap='round'
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        className={cn(
          'transition-[stroke-dashoffset,stroke] duration-500 ease-(--ease-out-strong)',
          tone.fill
        )}
      />
    </svg>
  );
}

function BreakdownRows({ budget }: { budget: ContextBudget }) {
  const free = freeTokensOf(budget);
  const parts = budget.parts.filter((part) => part.tokens > 0);

  return (
    <ul aria-label='What fills the context' className='flex flex-col'>
      {parts.map((part) => (
        <li key={part.id} className='flex h-7 items-center gap-2.5 text-[13px]'>
          <span
            aria-hidden='true'
            className='size-2 shrink-0 rounded-full'
            style={{ backgroundColor: PART_FILL[part.id] }}
          />
          <span className='min-w-0 flex-1 truncate'>{part.label}</span>
          <TokenCount tokens={part.tokens} className='text-muted-foreground' />
        </li>
      ))}
      <li className='flex h-7 items-center gap-2.5 text-[13px]'>
        <span
          aria-hidden='true'
          className='bg-foreground/[0.08] size-2 shrink-0 rounded-full'
        />
        <span className='min-w-0 flex-1 truncate'>Free</span>
        <TokenCount tokens={free} className='text-muted-foreground' />
      </li>
      <li className='flex h-7 items-center gap-2.5 text-[13px]'>
        <span
          aria-hidden='true'
          className='size-2 shrink-0 rounded-full'
          style={RESERVE_STYLE}
        />
        <span className='min-w-0 flex-1 truncate'>Held for the answer</span>
        <TokenCount tokens={budget.reserve} className='text-muted-foreground' />
      </li>
    </ul>
  );
}

export type ContextRingProps = {
  budget: ContextBudget;
  canCompact?: boolean;
  compactStatus?: CompactStatus;
  compaction?: Compaction | null;
  onCompact?: () => void;
  className?: string;
};

export function ContextRing({
  budget,
  canCompact = false,
  compactStatus = 'idle',
  compaction = null,
  onCompact,
  className,
}: ContextRingProps) {
  const used = usedTokensOf(budget);
  const share = shareOf(used, budget);
  const isWarning = share > WARNING_FROM;
  const percentLabel = percentLabelOf(share);
  const tone = ringToneOf(isWarning);
  const level = levelOf(budget);
  const isCompacting = compactStatus === 'compacting';
  const isCompactShown = canCompact || isCompacting;
  const trace = traceOf(compaction, isCompactShown);
  const triggerLabel = `Context ${percentLabel} used, open the breakdown`;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <button
                  type='button'
                  aria-label={triggerLabel}
                  className={cn(
                    'focus-visible:ring-ring focus-visible:ring-offset-background inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    tone.trigger,
                    className
                  )}
                />
              }
            />
          }
        >
          <RingGlyph share={share} isWarning={isWarning} />
        </TooltipTrigger>
        <TooltipContent>{percentLabel} of the context used</TooltipContent>
      </Tooltip>
      <PopoverContent side='top' align='end' className='w-72 p-3'>
        <div className='flex flex-col gap-3'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <PopoverTitle>Context</PopoverTitle>
              <p
                className={cn(
                  'mt-1 text-xs transition-colors duration-200',
                  LEVEL_TONE[level]
                )}
              >
                <WordRoll text={LEVEL_WORD[level]} labels={LEVEL_LABELS} />
              </p>
            </div>
            <p className='text-[13px] tabular-nums'>
              <TokenCount tokens={used} className='font-medium' />
              <span className='text-muted-foreground'>
                {' of '}
                <TokenCount tokens={budget.limit} />
              </span>
            </p>
          </div>
          <BreakdownRows budget={budget} />
          {isCompactShown && (
            <MorphButton
              type='button'
              size='sm'
              variant='outline'
              state={morphStateOf(compactStatus)}
              labels={COMPACT_LABELS}
              onClick={onCompact}
              className='self-start'
            />
          )}
          {trace && (
            <p className='text-muted-foreground flex items-center gap-2 text-xs'>
              <CheckIcon className='text-success-foreground size-3.5' />
              {compactionLineOf(trace)}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const MESSAGES = [
  'Start the quarterly review for Brightmoor Supply',
  'Use the Q3 invoices I attached',
  'Check their pricing page as well',
  'Which lines are above the list price?',
  'Add the contract terms on bulk orders',
  'How much did we overpay in total?',
  'Split that by month',
  'Draft an email asking for a credit',
  'Make it shorter and less formal',
  'Attach the comparison as a CSV',
  'Add a line about the October order',
  'Send it to accounts once I approve',
];

const OPENING_TURNS = 2;

function nextMessageOf(sentCount: number) {
  return MESSAGES[sentCount] ?? null;
}

function ringAnnouncementOf(budget: ContextBudget, sentCount: number) {
  if (sentCount === OPENING_TURNS) {
    return '';
  }
  const used = usedTokensOf(budget);
  const share = shareOf(used, budget);
  const percent = percentLabelOf(share);
  const level = levelOf(budget);
  return `Message sent. Context ${percent} used, ${LEVEL_WORD[level]}`;
}

export default function Run07() {
  const [sentCount, setSentCount] = useState(OPENING_TURNS);
  const turns = TURNS.slice(0, sentCount);
  const controls = useContextControls(turns);
  const nextMessage = nextMessageOf(sentCount);
  const hasNext = nextMessage !== null;
  const announcement = ringAnnouncementOf(controls.budget, sentCount);

  function send() {
    if (!hasNext) {
      return;
    }
    setSentCount((current) => current + 1);
  }

  function startOver() {
    controls.reset();
    setSentCount(OPENING_TURNS);
  }

  return (
    <div className='flex w-full max-w-[26rem] flex-col gap-2'>
      <div className='bg-card hairline-ring ring-border flex flex-col gap-2 rounded-xl p-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <p className='min-h-10 px-1.5 pt-1 text-[13px] leading-5'>
          <Swap swapKey={nextMessage ?? 'done'}>
            {hasNext && nextMessage}
            {!hasNext && (
              <span className='text-muted-foreground'>
                That was the last demo message
              </span>
            )}
          </Swap>
        </p>
        <div className='flex items-center gap-2'>
          <Badge variant='secondary'>Lumen Swift</Badge>
          <span className='flex-1' />
          <ContextRing
            budget={controls.budget}
            canCompact={controls.canCompact}
            compactStatus={controls.compactStatus}
            compaction={controls.compaction}
            onCompact={controls.compact}
          />
          <Button
            type='button'
            size='icon'
            aria-label='Send this demo message'
            disabled={!hasNext}
            onClick={send}
          >
            <ArrowUpIcon />
          </Button>
        </div>
      </div>
      <div className='flex h-7 items-center justify-between gap-2'>
        <p className='text-muted-foreground px-1 text-xs'>
          Each message adds its turn to the context
        </p>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={startOver}
          className='text-muted-foreground'
        >
          <RotateCcwIcon />
          Start over
        </Button>
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}
