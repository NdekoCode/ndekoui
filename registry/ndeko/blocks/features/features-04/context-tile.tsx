'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { formatTokens } from '@/registry/ndeko/lib/agent-run';

import { CONTEXT_LIMIT_TOKENS, TILES } from './data';
import { Tile } from './tile';

const RING_LENGTH = 100;

type ContextTileProps = {
  percent: number;
};

export function ContextTile({ percent }: ContextTileProps) {
  const offset = RING_LENGTH - percent;
  const usedTokens = (percent / 100) * CONTEXT_LIMIT_TOKENS;
  const used = formatTokens(usedTokens);
  const limit = formatTokens(CONTEXT_LIMIT_TOKENS);

  return (
    <Tile copy={TILES.context} stageClassName='items-center gap-3'>
      <div
        role='img'
        aria-label={`Context window ${Math.round(percent)} percent full`}
        className='relative size-28'
      >
        <svg viewBox='0 0 100 100' aria-hidden='true' className='size-full'>
          <circle
            cx='50'
            cy='50'
            r='44'
            fill='none'
            strokeWidth='8'
            className='stroke-foreground/10'
          />
          <circle
            cx='50'
            cy='50'
            r='44'
            fill='none'
            strokeWidth='8'
            strokeLinecap='round'
            pathLength={RING_LENGTH}
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={offset}
            transform='rotate(-90 50 50)'
            className='stroke-primary transition-[stroke-dashoffset] duration-700 ease-(--ease-out-strong) motion-reduce:transition-none'
          />
        </svg>
        <span
          aria-hidden='true'
          className='absolute inset-0 flex items-center justify-center text-2xl font-semibold'
        >
          <MotionNumber value={Math.round(percent)} suffix='%' />
        </span>
      </div>
      <p className='text-muted-foreground text-xs tabular-nums'>
        {used} of {limit} tokens
      </p>
    </Tile>
  );
}
