'use client';

import { cn } from '@/registry/ndeko/lib/utils';

import { SWAP_LABELS, SWAP_PAIRS, type SwapPair } from './data';
import { useSteps } from './use-steps';
import { type VisualProps } from './visual-props';

const FACE =
  'absolute inset-0 flex items-center justify-center rounded-lg px-1 text-center text-xs [backface-visibility:hidden]';

function turnOf(isFlipped: boolean) {
  if (isFlipped) {
    return '[transform:rotateX(180deg)]';
  }
  return undefined;
}

function readOutOf(pair: SwapPair, isFlipped: boolean) {
  if (isFlipped) {
    return pair.judgment;
  }
  return pair.busywork;
}

type SwapBlockProps = {
  pair: SwapPair;
  isFlipped: boolean;
};

function SwapBlock({ pair, isFlipped }: SwapBlockProps) {
  return (
    <li className='[perspective:700px]'>
      <span className='sr-only'>{readOutOf(pair, isFlipped)}</span>
      <div
        aria-hidden='true'
        className={cn(
          'relative h-14 transition-[transform] duration-500 ease-(--ease-out-strong) [transform-style:preserve-3d] motion-reduce:transition-none',
          turnOf(isFlipped)
        )}
      >
        <span
          className={cn(FACE, 'bg-foreground/[0.06] text-muted-foreground')}
        >
          {pair.busywork}
        </span>
        <span
          className={cn(
            FACE,
            'bg-primary/10 text-primary-ink [transform:rotateX(180deg)] font-medium'
          )}
        >
          {pair.judgment}
        </span>
      </div>
    </li>
  );
}

export function SwapVisual({ progress }: VisualProps) {
  const flipped = useSteps(progress, SWAP_PAIRS.length, 0.9);

  return (
    <div className='bg-card hairline-ring ring-border @container mx-auto flex w-full max-w-xl flex-col gap-5 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.12)] sm:p-6'>
      <div className='text-muted-foreground flex items-center gap-4 text-xs'>
        <span className='flex items-center gap-1.5'>
          <span className='bg-foreground/[0.12] size-2.5 rounded-[3px]' />
          {SWAP_LABELS.before}
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='bg-primary/40 size-2.5 rounded-[3px]' />
          {SWAP_LABELS.after}
        </span>
      </div>
      <ul className='grid grid-cols-4 gap-2 @xl:grid-cols-8'>
        {SWAP_PAIRS.map((pair, index) => (
          <SwapBlock
            key={pair.busywork}
            pair={pair}
            isFlipped={index < flipped}
          />
        ))}
      </ul>
      <p className='text-muted-foreground text-xs tabular-nums'>
        {flipped} of {SWAP_PAIRS.length} tasks are now judgment
      </p>
    </div>
  );
}
