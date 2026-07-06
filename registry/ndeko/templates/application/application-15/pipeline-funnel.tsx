'use client';

import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';

import { STAGES } from './data';
import { MorphPath } from './morph-path';

const VIEW_WIDTH = 1000;

const ROW_HEIGHT = 40;

const ROW_GAP = 4;

const MIN_SHARE = 0.12;

const NECK = 0.86;

const FUNNEL_HEIGHT = ROW_HEIGHT * STAGES.length;

/** The first four stages are the primary colour, fading as the funnel narrows. The last one is a won deal. */
const ROW_FILL = [
  'fill-primary/90',
  'fill-primary/75',
  'fill-primary/60',
  'fill-primary/45',
  'fill-success/80',
];

function sharesOf(counts: number[]) {
  const first = counts[0];
  return counts.map((count) => {
    if (first === 0) {
      return MIN_SHARE;
    }
    return Math.max(count / first, MIN_SHARE);
  });
}

function bottomShareOf(index: number, shares: number[]) {
  const next = shares[index + 1];
  if (next === undefined) {
    return shares[index] * NECK;
  }
  return next;
}

/** A row runs from the width of its stage to the width of the next one, so the rows join into one funnel. */
function rowPathOf(index: number, shares: number[]) {
  const half = VIEW_WIDTH / 2;
  const topHalf = shares[index] * half;
  const bottomHalf = bottomShareOf(index, shares) * half;
  const top = index * ROW_HEIGHT + ROW_GAP / 2;
  const bottom = (index + 1) * ROW_HEIGHT - ROW_GAP / 2;
  const topLeft = half - topHalf;
  const topRight = half + topHalf;
  const bottomLeft = half - bottomHalf;
  const bottomRight = half + bottomHalf;
  return `M${topLeft} ${top} L${topRight} ${top} L${bottomRight} ${bottom} L${bottomLeft} ${bottom} Z`;
}

function moveOnOf(count: number, before: number) {
  if (before === 0) {
    return 0;
  }
  return Math.round((count / before) * 100);
}

type PipelineFunnelProps = {
  counts: number[];
};

export function PipelineFunnel({ counts }: PipelineFunnelProps) {
  const titleId = useId();
  const shares = sharesOf(counts);

  return (
    <section
      data-section='pipeline'
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex scroll-mt-4 flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex flex-col leading-tight'>
        <h2 id={titleId} className='text-sm font-medium'>
          Pipeline
        </h2>
        <p className='text-muted-foreground text-xs'>
          Deals that reached each stage
        </p>
      </header>
      <div className='grid grid-cols-[9.5rem_minmax(0,1fr)] gap-x-3'>
        <ol aria-label='Deals by stage' className='flex flex-col'>
          {STAGES.map((stage, index) => {
            const before = counts[index - 1] ?? 0;
            const share = moveOnOf(counts[index], before);
            const hasShare = index > 0;
            return (
              <li
                key={stage.id}
                className='flex h-10 items-center gap-2 text-[13px]'
              >
                <span className='text-muted-foreground min-w-0 flex-1 truncate'>
                  {stage.label}
                </span>
                <MotionNumber
                  value={counts[index]}
                  className='w-9 justify-end font-medium'
                />
                <span
                  className={cn(
                    'text-muted-foreground hidden w-9 text-end text-xs tabular-nums @md/page:block',
                    !hasShare && 'invisible'
                  )}
                >
                  {share}%<span className='sr-only'> of the stage before</span>
                </span>
              </li>
            );
          })}
        </ol>
        <svg
          aria-hidden='true'
          viewBox={`0 0 ${VIEW_WIDTH} ${FUNNEL_HEIGHT}`}
          preserveAspectRatio='none'
          className='w-full overflow-visible'
          style={{ height: FUNNEL_HEIGHT }}
        >
          {STAGES.map((stage, index) => (
            <MorphPath
              key={stage.id}
              d={rowPathOf(index, shares)}
              className={ROW_FILL[index]}
            />
          ))}
        </svg>
      </div>
    </section>
  );
}
