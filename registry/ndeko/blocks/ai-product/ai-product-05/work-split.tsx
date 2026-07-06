'use client';

import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { UsersRoundIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import {
  BLOCK_SHARE,
  BLOCKS,
  BUSYWORK_AFTER,
  BUSYWORK_BEFORE,
  CAPTION_WORDS,
  flipRankOf,
  FLIP_COUNT,
  FLIPS_START,
  SECTION,
  WORDS_END,
} from './data';

const TICK_COUNT = 40;

const TICK_MS = 110;

const FIRST_TICK_MS = 1000;

const LOOP_AFTER_MS = 3800;

/** A share that lands on a whole block, such as 0.3 times 10, must not fall to the block before. */
const ROUNDING_GUARD = 0.0001;

function clamped(value: number) {
  const atLeastNone = Math.max(0, value);
  return Math.min(1, atLeastNone);
}

function tickAfterOf(index: number) {
  if (index === 0) {
    return FIRST_TICK_MS;
  }
  return TICK_MS;
}

const TICK_VALUES = Array.from({ length: TICK_COUNT }, (_, index) => index + 1);

function litWordsOf(progress: number) {
  const share = clamped(progress / WORDS_END);
  const words = share * CAPTION_WORDS.length;
  return Math.round(words);
}

function flippedOf(progress: number) {
  const span = 1 - FLIPS_START;
  const sinceStart = progress - FLIPS_START;
  const share = clamped(sinceStart / span);
  const blocks = share * FLIP_COUNT;
  return Math.floor(blocks + ROUNDING_GUARD);
}

function isJudgment(blockIndex: number, flipped: number) {
  if (blockIndex >= BUSYWORK_BEFORE) {
    return true;
  }
  const rank = flipRankOf(blockIndex);
  if (rank === null) {
    return false;
  }
  return rank < flipped;
}

function blockToneOf(isJudgmentBlock: boolean) {
  if (isJudgmentBlock) {
    return 'bg-primary scale-y-100';
  }
  return 'bg-foreground/[0.16] scale-y-[0.7]';
}

function wordToneOf(isLit: boolean) {
  if (isLit) {
    return 'text-foreground';
  }
  return 'text-foreground/25';
}

function phaseOf(flipped: number) {
  if (flipped === 0) {
    return 'Before the agent';
  }
  if (flipped >= FLIP_COUNT) {
    return 'With the agent';
  }
  return 'The agent takes over';
}

function percentLabel(blocks: number) {
  const share = blocks * BLOCK_SHARE;
  const percent = Math.round(share);
  return `${percent}%`;
}

/** The position drawn: the one given, the step the demonstration is on, or the end once a person takes over. */
function shownOf(
  progress: number | undefined,
  isAutoplaying: boolean,
  tick: number
) {
  if (progress !== undefined) {
    return clamped(progress);
  }
  if (isAutoplaying) {
    return tick / TICK_COUNT;
  }
  return 1;
}

export type WorkSplitProps = {
  /**
   * A position between 0 and 1, from a scroll or a slider. Without it the story plays by itself
   * while it is on screen.
   */
  progress?: number;
  className?: string;
};

export function WorkSplit({ progress, className }: WorkSplitProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [tick, setTick] = useState(0);
  const isControlled = progress !== undefined;
  const steps = TICK_VALUES.map((value, index) => ({
    after: tickAfterOf(index),
    run: () => setTick(value),
  }));
  const { ref, isAutoplaying, restart } = useAutoplay<HTMLElement>(steps, {
    loopAfter: LOOP_AFTER_MS,
    onReset: () => setTick(0),
    isEnabled: !isControlled,
  });
  const shown = shownOf(progress, isAutoplaying, tick);
  const litWords = litWordsOf(shown);
  const flipped = flippedOf(shown);
  const busyBlocks = BUSYWORK_BEFORE - flipped;
  const judgmentBlocks = BLOCKS.length - busyBlocks;
  const phase = phaseOf(flipped);
  const playsItself = !isControlled;
  const hasEnded = !isAutoplaying;
  const canPlay = !shouldReduceMotion;
  const canReplay = playsItself && hasEnded && canPlay;
  const beforeShare = percentLabel(BUSYWORK_BEFORE);
  const afterShare = percentLabel(BUSYWORK_AFTER);
  const summary = `Before the agent, ${beforeShare} of the week is busywork. With the agent, ${afterShare}.`;

  return (
    <section ref={ref} className={cn('@container', className)}>
      <div className='mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 @2xl:px-6 @2xl:py-24'>
        <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
          <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
            <UsersRoundIcon className='size-4' />
            {SECTION.label}
          </p>
          <div className='flex items-center gap-2'>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay'
            />
            <Badge variant='secondary'>Illustrative</Badge>
          </div>
        </div>
        <p className='text-xl font-semibold text-balance @2xl:text-3xl'>
          {CAPTION_WORDS.map((word, index) => (
            <span
              key={index}
              className={cn(
                'transition-colors duration-300 ease-(--ease-out-strong)',
                wordToneOf(index < litWords)
              )}
            >
              {word}{' '}
            </span>
          ))}
        </p>
        <div className='flex flex-col gap-3'>
          <p className='text-muted-foreground text-[13px]'>
            <Swap swapKey={phase}>{phase}</Swap>
          </p>
          <div role='img' aria-label={summary} className='flex h-12 gap-[3px]'>
            {BLOCKS.map((blockIndex) => (
              <span
                key={blockIndex}
                aria-hidden='true'
                className={cn(
                  'flex-1 origin-bottom rounded-[3px] transition-[background-color,scale] duration-300 ease-(--ease-out-strong)',
                  blockToneOf(isJudgment(blockIndex, flipped))
                )}
              />
            ))}
          </div>
          <dl className='grid grid-cols-2 gap-4 text-[13px]'>
            <div className='flex flex-col gap-0.5'>
              <dt className='text-muted-foreground flex items-center gap-2'>
                <span className='bg-foreground/[0.16] size-2 rounded-[2px]' />
                Busywork
              </dt>
              <dd className='w-12 text-2xl font-semibold tabular-nums'>
                {percentLabel(busyBlocks)}
              </dd>
            </div>
            <div className='flex flex-col items-end gap-0.5 text-end'>
              <dt className='text-muted-foreground flex items-center gap-2'>
                Judgment
                <span className='bg-primary size-2 rounded-[2px]' />
              </dt>
              <dd className='w-12 text-2xl font-semibold tabular-nums'>
                {percentLabel(judgmentBlocks)}
              </dd>
            </div>
          </dl>
          <p className='text-muted-foreground text-xs'>{SECTION.note}</p>
        </div>
      </div>
    </section>
  );
}
