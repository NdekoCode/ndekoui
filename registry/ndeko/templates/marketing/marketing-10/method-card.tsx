'use client';

import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { cn } from '@/registry/ndeko/lib/utils';

import { BentoCard } from './bento-card';
import { METHOD } from './data';

const STEP_MS = 2800;

function stepTextOf(isActive: boolean) {
  if (isActive) {
    return 'text-foreground';
  }
  return 'text-muted-foreground';
}

function descriptionRowsOf(isActive: boolean) {
  if (isActive) {
    return 'grid-rows-[1fr]';
  }
  return 'grid-rows-[0fr]';
}

function barScaleOf(isActive: boolean) {
  if (isActive) {
    return 'scale-y-100';
  }
  return 'scale-y-0';
}

function currentOf(isActive: boolean) {
  if (isActive) {
    return 'step' as const;
  }
  return undefined;
}

export function MethodCard({ className }: { className?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const steps = METHOD.slice(1).map((step, offset) => ({
    after: STEP_MS,
    run: () => setActiveIndex(offset + 1),
  }));
  const { ref } = useAutoplay(steps, {
    loopAfter: STEP_MS,
    onReset: () => setActiveIndex(0),
  });

  useKeptHeight(ref);

  return (
    <BentoCard title='How I work' className={className}>
      <div ref={ref}>
        <ol className='relative flex flex-col'>
          <span
            aria-hidden='true'
            className='bg-foreground/[0.08] absolute inset-y-3 start-0 w-0.5 rounded-full'
          />
          {METHOD.map((step, index) => {
            const isActive = index === activeIndex;

            return (
              <li key={step.id}>
                <button
                  type='button'
                  aria-current={currentOf(isActive)}
                  onClick={() => setActiveIndex(index)}
                  className='focus-visible:ring-ring/25 relative flex w-full flex-col gap-1 rounded-lg py-3 ps-4 pe-2 text-start outline-none focus-visible:ring-[3px]'
                >
                  <span
                    aria-hidden='true'
                    className={cn(
                      'bg-primary absolute inset-y-3 start-0 w-0.5 rounded-full transition-[scale] duration-300 ease-(--ease-out-strong) motion-reduce:transition-none',
                      barScaleOf(isActive)
                    )}
                  />
                  <span
                    className={cn(
                      'flex items-baseline gap-2 text-[13px] font-medium transition-colors duration-200',
                      stepTextOf(isActive)
                    )}
                  >
                    <span className='text-xs tabular-nums'>{index + 1}</span>
                    {step.title}
                  </span>
                  <span
                    className={cn(
                      'grid transition-[grid-template-rows] duration-300 ease-(--ease-out-strong) motion-reduce:transition-none',
                      descriptionRowsOf(isActive)
                    )}
                  >
                    <span className='text-muted-foreground overflow-hidden text-[13px] text-pretty'>
                      {step.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </BentoCard>
  );
}
