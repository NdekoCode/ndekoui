'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { TrendingDownIcon, TrendingUpIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { CASES, TARGETS, type Target } from './data';
import {
  candidateRateOf,
  PRODUCTION_RATE,
  type EvalState,
  type PassRate,
} from './session';

type Change = {
  text: string;
  tone: string;
  trend: 'up' | 'down' | 'level';
};

function pointsOf(count: number) {
  if (count === 1) {
    return '1 point';
  }
  return `${count} points`;
}

function changeOf(candidate: PassRate): Change {
  const difference = candidate.percent - PRODUCTION_RATE.percent;
  const points = pointsOf(Math.abs(difference));
  if (difference < 0) {
    return {
      text: `${points} under production`,
      tone: 'text-warning-foreground',
      trend: 'down',
    };
  }
  if (difference > 0) {
    return {
      text: `${points} above production`,
      tone: 'text-success-foreground',
      trend: 'up',
    };
  }
  return {
    text: 'Level with production',
    tone: 'text-muted-foreground',
    trend: 'level',
  };
}

function candidateNoteOf(state: EvalState, rate: PassRate): Change {
  if (state.phase === 'idle') {
    return {
      text: 'Not compared with production yet',
      tone: 'text-muted-foreground',
      trend: 'level',
    };
  }
  if (state.phase === 'running') {
    return {
      text: `${state.landed} of ${CASES.length} cases run`,
      tone: 'text-muted-foreground',
      trend: 'level',
    };
  }
  return changeOf(rate);
}

/** While the run counts its cases the note stays in place; it swaps when its sentence changes. */
function noteKeyOf(state: EvalState, note: Change) {
  if (state.phase === 'running') {
    return 'running';
  }
  return note.text;
}

function productionNoteOf(isReplaced: boolean) {
  if (isReplaced) {
    return 'Kept for a rollback';
  }
  return 'Answers every conversation today';
}

function badgeWordOf(isLive: boolean, restingWord: string) {
  if (isLive) {
    return 'Live';
  }
  return restingWord;
}

function badgeVariantOf(isLive: boolean) {
  if (isLive) {
    return 'success';
  }
  return 'secondary';
}

function fillOf(percent: number) {
  const share = percent / 100;
  return { transform: `scaleX(${share})` };
}

type VersionCardProps = {
  target: Target;
  rate: PassRate | null;
  badgeWord: string;
  isLive: boolean;
  note: React.ReactNode;
};

function VersionCard({
  target,
  rate,
  badgeWord,
  isLive,
  note,
}: VersionCardProps) {
  const percent = rate?.percent ?? 0;

  return (
    <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex min-w-0 flex-col gap-2 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <p className='flex flex-wrap items-center gap-x-2 gap-y-1'>
        <span className='text-[13px] font-medium'>{target.label}</span>
        <code className='text-muted-foreground font-mono text-xs'>
          {target.version}
        </code>
        <Badge
          variant={badgeVariantOf(isLive)}
          className='ms-auto transition-colors duration-300'
        >
          <Swap swapKey={badgeWord}>{badgeWord}</Swap>
        </Badge>
      </p>
      <div className='flex min-h-9 flex-wrap items-baseline gap-x-2'>
        {rate && (
          <>
            <MotionNumber
              value={rate.percent}
              suffix='%'
              className='text-[28px] leading-9 font-semibold'
            />
            <span className='text-muted-foreground text-xs tabular-nums'>
              {rate.passed} of {rate.total} passed
            </span>
          </>
        )}
        {!rate && (
          <span className='text-muted-foreground text-xl leading-9 font-medium'>
            Not run yet
          </span>
        )}
      </div>
      <div
        role='progressbar'
        aria-label={`${target.label} pass rate`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className='bg-foreground/[0.06] h-1.5 overflow-hidden rounded-full'
      >
        <div
          style={fillOf(percent)}
          className='bg-success h-full origin-left rounded-full transition-transform duration-500 ease-(--ease-out-strong)'
        />
      </div>
      <div className='flex min-h-5 items-center text-xs'>{note}</div>
    </div>
  );
}

function TrendGlyph({ trend }: { trend: Change['trend'] }) {
  if (trend === 'up') {
    return <TrendingUpIcon className='size-3.5 shrink-0' />;
  }
  if (trend === 'down') {
    return <TrendingDownIcon className='size-3.5 shrink-0' />;
  }
  return null;
}

type VersionsProps = {
  state: EvalState;
};

export function Versions({ state }: VersionsProps) {
  const isShipped = state.ship === 'done';
  const hasFigure = state.landed > 0;
  const landedRate = candidateRateOf(state);
  let candidateRate: PassRate | null = null;
  if (hasFigure) {
    candidateRate = landedRate;
  }
  const candidateNote = candidateNoteOf(state, landedRate);
  const productionNote = productionNoteOf(isShipped);

  return (
    <div className='grid grid-cols-1 gap-3 @md:grid-cols-2'>
      <VersionCard
        target={TARGETS.production}
        rate={PRODUCTION_RATE}
        badgeWord={badgeWordOf(!isShipped, 'Previous')}
        isLive={!isShipped}
        note={
          <span className='text-muted-foreground'>
            <Swap swapKey={productionNote}>{productionNote}</Swap>
          </span>
        }
      />
      <VersionCard
        target={TARGETS.candidate}
        rate={candidateRate}
        badgeWord={badgeWordOf(isShipped, 'Candidate')}
        isLive={isShipped}
        note={
          <span
            className={cn(
              'tabular-nums transition-colors duration-200',
              candidateNote.tone
            )}
          >
            <Swap swapKey={noteKeyOf(state, candidateNote)}>
              <span className='flex items-center gap-1.5'>
                <TrendGlyph trend={candidateNote.trend} />
                {candidateNote.text}
              </span>
            </Swap>
          </span>
        }
      />
    </div>
  );
}
