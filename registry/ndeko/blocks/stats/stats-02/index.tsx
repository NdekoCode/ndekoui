'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { TrendingUpIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { RESULTS, SECTION, type Result } from './data';
import { ScoreCard } from './score-card';

const ARRIVES_AFTER_MS = 500;

function formatOf(fractionDigits: number): Intl.NumberFormatOptions {
  return {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  };
}

function shownOf(isRolled: boolean, value: number) {
  if (isRolled) {
    return value;
  }
  return 0;
}

type ResultItemProps = {
  result: Result;
  isRolled: boolean;
};

function ResultItem({ result, isRolled }: ResultItemProps) {
  return (
    <li className='bg-foreground/[0.05] flex min-w-0 flex-col gap-3 rounded-xl p-5'>
      <p className='flex'>
        <MotionNumber
          value={shownOf(isRolled, result.value)}
          format={formatOf(result.fractionDigits)}
          suffix={result.suffix}
          className='text-4xl font-semibold @2xl:text-5xl'
        />
      </p>
      <div className='flex flex-col gap-1'>
        <p className='text-[13px] font-medium'>{result.label}</p>
        <p className='text-muted-foreground text-xs text-pretty'>
          {result.compare}
        </p>
      </div>
    </li>
  );
}

export default function Stats02() {
  const [hasArrived, setHasArrived] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const steps = [{ after: ARRIVES_AFTER_MS, run: () => setHasArrived(true) }];
  const { ref, isAutoplaying, restart } = useAutoplay<HTMLElement>(steps, {
    onReset: () => setHasArrived(false),
  });
  const isTakenOver = !isAutoplaying;
  const isRolled = hasArrived || isTakenOver;
  const canReplay = isRolled && !shouldReduceMotion;

  return (
    <section
      ref={ref}
      className='dark bg-sidebar text-foreground @container w-full'
    >
      <div className='mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8'>
        <header className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
          <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
            <TrendingUpIcon className='size-4' />
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
        </header>
        <div className='grid items-center gap-12 @4xl:grid-cols-[minmax(0,1fr)_18rem]'>
          <div className='flex flex-col gap-10'>
            <h2 className='max-w-3xl text-3xl font-semibold text-balance @2xl:text-5xl'>
              {SECTION.mission}
            </h2>
            <ul className='grid gap-3 @2xl:grid-cols-3'>
              {RESULTS.map((result) => (
                <ResultItem
                  key={result.id}
                  result={result}
                  isRolled={isRolled}
                />
              ))}
            </ul>
            <p className='text-muted-foreground text-xs'>{SECTION.note}</p>
          </div>
          <ScoreCard isRolled={isRolled} />
        </div>
      </div>
    </section>
  );
}
