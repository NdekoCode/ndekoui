'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { Wash } from '@/registry/ndeko/ui/wash';

import { SCORE } from './data';
import { ScoreRing } from './score-ring';

const MAX_SCORE = 100;

type ScoreCardProps = {
  /** The score reads zero until the section has arrived, then rolls to its value as the ring closes. */
  isRolled: boolean;
};

function shownOf(isRolled: boolean) {
  if (isRolled) {
    return SCORE.value;
  }
  return 0;
}

export function ScoreCard({ isRolled }: ScoreCardProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const score = shownOf(isRolled);

  return (
    <article
      aria-label={`${SCORE.title}: ${SCORE.value} out of ${MAX_SCORE}`}
      className='surface-brand relative isolate mx-auto flex w-full max-w-72 -rotate-3 flex-col gap-5 rounded-2xl p-5 @4xl:mx-0'
    >
      <Wash shape='top' />
      <header className='flex items-baseline justify-between gap-3'>
        <h3 className='text-sm font-medium'>{SCORE.title}</h3>
        <p className='text-muted-foreground text-xs'>{SCORE.period}</p>
      </header>
      <div className='flex items-center gap-4'>
        <ScoreRing
          score={score}
          max={MAX_SCORE}
          shouldReduceMotion={shouldReduceMotion}
        >
          <span className='flex flex-col items-center leading-none'>
            <MotionNumber value={score} className='text-4xl font-semibold' />
            <span className='text-muted-foreground mt-1 text-[11px]'>
              out of {MAX_SCORE}
            </span>
          </span>
        </ScoreRing>
        <p className='text-muted-foreground text-xs text-pretty'>
          {SCORE.caption}
        </p>
      </div>
    </article>
  );
}
